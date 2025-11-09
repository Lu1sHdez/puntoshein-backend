// src/controllers/admin.controller.js
import bcrypt from 'bcryptjs';
import Sequelize from 'sequelize';
import Usuario from '../models/usuario.model.js';  // Asegúrate de tener el modelo de usuario correctamente importado
import nodemailer from 'nodemailer';
import InvitacionEmpleado from '../models/invitacionEmpleado.model.js';
import logger from '../libs/logger.js'; // Si ya usas winston u otro logger
import jwt from 'jsonwebtoken';

export const enviarInvitacionEmpleado = async (req, res) => {
  try {
    const { correo } = req.body;

    // Validaciones
    const errores = {};

    if (!correo || !correo.trim()) {
      errores.correo = "El correo es obligatorio.";
    } else {
      const formatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formatoValido.test(correo)) {
        errores.correo = "El formato del correo no es válido.";
      }
    }

    // Verificar existencia de usuario con el correo
    const existente = await Usuario.findOne({ where: { correo } });
    if (existente) {
      errores.correo = "Ya existe un usuario registrado con ese correo.";
    }

    // Si hay errores, devolverlos
    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    // Crear token temporal
    const token = jwt.sign({ correo }, process.env.TOKEN_SECRET, { expiresIn: "15min" });
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    // Guardar invitación en base de datos
    await InvitacionEmpleado.create({
      correo,
      token,
      expiracion,
      estado: 'pendiente',
    });

    const enlace = `${process.env.FRONTEND_URL}/registro/e?token=${token}`;

    // Envío de correo
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"Punto Shein" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: "Invitación para registrarte como empleado",
      html: `
        <p>Has sido invitado a registrarte como empleado en Punto Shein.</p>
        <p>Haz clic en el siguiente enlace para completar tu registro:</p>
        <a href="${enlace}">Haz clic aquí para registrarte</a>
        <p>Este enlace expirará en 15 minutos.</p>
      `,  
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ mensaje: "Invitación enviada correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al enviar la invitación." });
  }
};
export const recuperarPasswordAdmin = async (req, res) => {
  try {
    const { correo } = req.body;

    const usuario = await Usuario.findOne({ where: { correo, rol: 'administrador' } });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Correo no registrado o no es administrador." });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString(); // Genera código de 6 dígitos
    const expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos a partir de ahora

    usuario.codigoCambioPassword = codigo;
    usuario.codigoCambioExpira = expiracion;
    await usuario.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"Punto Shein Admin" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Código de recuperación de contraseña',
      html: `
        <p>Hola ${usuario.nombre},</p>
        <p>Tu código para restablecer la contraseña es:</p>
        <h2>${codigo}</h2>
        <p>Este código expira en 10 minutos.</p>
        <p>Si no solicitaste esto, ignora este mensaje.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).json({ mensaje: "Error al enviar el correo." });
      }
      res.status(200).json({ mensaje: "Código de verificación enviado al correo." });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
export const restablecerPasswordAdmin = async (req, res) => {
  try {
    const { correo, codigo, nuevaContrasena } = req.body;

    const usuario = await Usuario.findOne({ where: { correo, rol: 'administrador' } });
    if (!usuario || usuario.codigoCambioPassword !== codigo) {
      return res.status(400).json({ mensaje: "Código incorrecto o usuario no válido." });
    }

    if (new Date() > new Date(usuario.codigoCambioExpira)) {
      return res.status(400).json({ mensaje: "El código ha expirado." });
    }

    // 🕒 Validar política de espera de 24 horas desde el último cambio
    const ultimoCambioPassword = usuario.ultimoCambioPassword ? new Date(usuario.ultimoCambioPassword).getTime() : 0;
    const tiempoActual = Date.now();
    const tiempoLimite = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    const tiempoRestante = tiempoLimite - (tiempoActual - ultimoCambioPassword);

    if (tiempoRestante > 0) {
      const horasRestantes = Math.floor(tiempoRestante / (1000 * 60 * 60));
      const minutosRestantes = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
      return res.status(400).json({
        mensaje: `Cambiaste tu contraseña recientemente. Intenta nuevamente en ${horasRestantes} horas y ${minutosRestantes} minutos.`,
      });
    }

    // 🔒 Validar seguridad de contraseña
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(nuevaContrasena)) {
      return res.status(400).json({
        mensaje: "Contraseña inválida. Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.",
      });
    }

    usuario.password = await bcrypt.hash(nuevaContrasena, 10);
    usuario.codigoCambioPassword = null;
    usuario.codigoCambioExpira = null;
    usuario.ultimoCambioPassword = new Date();
    await usuario.save();

    logger.info({
      message: "Contraseña ADMIN restablecida por código",
      usuario_id: usuario.id,
      ip_cliente: req.ip,
    });

    res.status(200).json({ mensaje: "Contraseña actualizada correctamente." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al restablecer la contraseña." });
  }
};
export const cambiarPasswordAdmin = async (req, res) => {
  try {
    const { actual, nueva, confirmar } = req.body;
    const usuarioId = req.usuario.id;

    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario || usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'Acceso no autorizado.' });
    }

    const validPassword = await bcrypt.compare(actual, usuario.password);
    if (!validPassword) {
      return res.status(400).json({ mensaje: 'Contraseña actual incorrecta.' });
    }

    if (nueva !== confirmar) {
      return res.status(400).json({ mensaje: 'Las nuevas contraseñas no coinciden.' });
    }

    // Validar política de espera de 24 horas desde el último cambio
    const ultimoCambio = usuario.ultimoCambioPassword ? new Date(usuario.ultimoCambioPassword).getTime() : 0;
    const ahora = Date.now();
    const limite24h = 24 * 60 * 60 * 1000;
    const diferencia = ahora - ultimoCambio;

    if (diferencia < limite24h) {
      const tiempoRestante = limite24h - diferencia;
      const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
      const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));

      return res.status(400).json({
        mensaje: `Ya cambiaste tu contraseña recientemente. Intenta nuevamente en ${horas} horas y ${minutos} minutos.`,
      });
    }

    // Validar formato seguro
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(nueva)) {
      return res.status(400).json({
        mensaje: "Contraseña inválida. Debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.",
      });
    }

    usuario.password = await bcrypt.hash(nueva, 10);
    usuario.ultimoCambioPassword = new Date();
    await usuario.save();

    logger.info({
      message: "Contraseña ADMIN cambiada manualmente",
      usuario_id: usuario.id,
      ip_cliente: req.ip,
    });

    res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña.' });
  }
};
export const validarCodigoAdmin = async (req, res) => {
  try {
    const { correo, codigo } = req.body;

    const usuario = await Usuario.findOne({ where: { correo, rol: 'administrador' } });

    if (!usuario || usuario.codigoCambioPassword !== codigo) {
      return res.status(400).json({ mensaje: "Código incorrecto o administrador inválido." });
    }

    if (new Date() > new Date(usuario.codigoCambioExpira)) {
      return res.status(400).json({ mensaje: "El código ha expirado." });
    }

    return res.status(200).json({ mensaje: "Código válido." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al validar el código." });
  }
};
export const obtenerUsuarios = async (req, res) => {
  try {
    const { rol, search } = req.query;  // Obtener el rol y la búsqueda desde la query string
    const whereClause = {};

    if (rol) {
      whereClause.rol = rol;  // Filtrar por rol si se pasa
    }

    if (search) {
      // Filtrar por nombre o correo si se pasa el término de búsqueda
      whereClause[Sequelize.Op.or] = [
        { nombre: { [Sequelize.Op.like]: `%${search}%` } },
        { correo: { [Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const usuarios = await Usuario.findAll({
      where: whereClause  // Aplicar los filtros de manera segura
    });


    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los usuarios.' });
  }
};
export const obtenerIdsUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id'] // Solo selecciona la columna 'id'
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los IDs de usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los IDs de usuarios.' });
  }
};
export const obtenerEmpleados = async (req, res) => {
  try {
    const empleados = await Usuario.findAll({
      where: { rol: 'empleado' }  // Filtramos por empleados
    });
    res.json(empleados);
  } catch (error) {
    console.error('Error al obtener los empleados:', error);
    res.status(500).json({ mensaje: 'Error al obtener los empleados.' });
  }
};
export const obtenerSoloUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { rol: 'usuario' }  // Filtramos solo los usuarios
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los usuarios.' });
  }
};
export const obtenerAdmins = async (req, res) => {
  try {
    const admins = await Usuario.findAll({
      where: { rol: 'administrador' }  // Filtramos solo los administradores
    });
    res.json(admins);
  } catch (error) {
    console.error('Error al obtener los administradores:', error);
    res.status(500).json({ mensaje: 'Error al obtener los administradores.' });
  }
};
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await Usuario.destroy({
      where: { id }
    });
    res.status(200).json({ mensaje: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el usuario.' });
  }
};
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;  // Obtener el ID del usuario desde los parámetros de la URL
    const usuario = await Usuario.findByPk(id);  // Buscar el usuario por su ID

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json(usuario);  // Devolver los detalles del usuario
  } catch (error) {
    console.error('Error al obtener los detalles del usuario:', error);
    res.status(500).json({ mensaje: 'Error al obtener los detalles del usuario.' });
  }
};
export const obtenerRoles = async (req, res) => {
  try {
    const roles = ['usuario', 'administrador', 'empleado']; // Lista de roles posibles
    res.json({ roles }); // Solo devolvemos los roles
  } catch (error) {
    console.error('Error al obtener los roles:', error);
    res.status(500).json({ mensaje: 'Error al obtener los roles.' });
  }
};
export const actualizarRol = async (req, res) => {
  const { id } = req.params;  // Obtener el ID del usuario desde la URL
  const { rol } = req.body;   // Obtener el nuevo rol del cuerpo de la solicitud

  try {
    // Validamos que el rol sea uno de los valores permitidos
    const rolesValidos = ['usuario', 'administrador', 'empleado'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ mensaje: 'Rol no válido' });
    }
    
    // Verificar si el usuario es el único administrador
    if (rol === 'usuario' || rol ==='empleado') {
      const totalAdmins = await Usuario.count({ where: { rol: 'administrador' } });
      
      if (totalAdmins === 1) {
        return res.status(400).json({ mensaje: 'No puedes cambiar el rol del único administrador. Asigna otro administrador primero.' });
      }
    }

    // Buscamos al usuario por ID
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Actualizamos el rol del usuario
    usuario.rol = rol;
    await usuario.save();

    res.status(200).json({ mensaje: 'Rol actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar el rol:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el rol' });
  }
};
export const obtenerPerfilAdmin = async (req, res) => {
  try {
    // Obtener el ID del token verificado en el middleware
    const adminId = req.userId;

    // Buscar al administrador en la base de datos
    const admin = await Usuario.findByPk(adminId, {
      attributes: [
        'id',
        'nombre_usuario',
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'correo',
        'telefono',
        'rol',
        'genero',
        'ubicacion',
        'createdAt',
        'updatedAt',
        'ultimoCambioPassword'
      ],
    });

    if (!admin) {
      return res.status(404).json({ mensaje: 'Administrador no encontrado.' });
    }

    // Verificación de rol
    if (admin.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'Acceso denegado. No eres administrador.' });
    }

    // Log opcional
    logger.info({
      message: 'Perfil de administrador obtenido correctamente',
      usuario_id: admin.id,
      ip_cliente: req.ip,
    });

    // Estructura del perfil con detalles enriquecidos
    const perfilAdmin = {
      id: admin.id,
      nombre_usuario: admin.nombre_usuario,
      nombre_completo: `${admin.nombre} ${admin.apellido_paterno} ${admin.apellido_materno}`,
      correo: admin.correo,
      telefono: admin.telefono,
      rol: admin.rol,
      genero: admin.genero === 'H' ? 'Hombre' : admin.genero === 'M' ? 'Mujer' : 'No especificado',
      ubicacion: admin.ubicacion || 'Sin ubicación registrada',
      fecha_creacion: admin.createdAt,
      ultima_actualizacion: admin.updatedAt,
      ultimo_cambio_password: admin.ultimoCambioPassword
        ? new Date(admin.ultimoCambioPassword).toLocaleString()
        : 'Nunca ha cambiado su contraseña',
    };

    return res.status(200).json({ success: true, perfil: perfilAdmin });

  } catch (error) {
    logger.error({
      message: 'Error al obtener perfil del administrador',
      error: error.message,
      stack: error.stack,
      ip_cliente: req.ip,
    });
    return res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};

