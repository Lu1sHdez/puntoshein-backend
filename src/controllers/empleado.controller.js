import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/usuario.model.js';
import nodemailer from 'nodemailer';
import { crearTokenRecuperacion } from '../libs/crearTokenAcceso.js';
import InvitacionEmpleado from '../models/invitacionEmpleado.model.js';

export const registroEmpleado = async (req, res) => {
  try {
    const { token, password, nombre, apellido_paterno, apellido_materno, telefono, ubicacion, genero } = req.body;

    const errores = {};

    // Validar existencia y vigencia del token
    if (!token) {
      return res.status(400).json({ errores: { token: "Token no proporcionado." } });
    }

    const invitacion = await InvitacionEmpleado.findOne({ where: { token } });

    if (!invitacion) {
      return res.status(400).json({ errores: { token: "Token inválido." } });
    }

    if (invitacion.estado !== 'pendiente') {
      return res.status(400).json({ errores: { token: "La invitación ya fue utilizada o ha expirado." } });
    }

    if (new Date(invitacion.expiracion) < new Date()) {
      invitacion.estado = 'expirada';
      await invitacion.save();
      return res.status(400).json({ errores: { token: "La invitación ha expirado." } });
    }

    const correo = invitacion.correo;
 
    // Validaciones del resto de campos
    if (!password) {
      errores.password = "La contraseña es obligatoria.";
    } else {
      const esSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
      if (!esSegura) {
        errores.password =
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.";
      }
    }

    if (!nombre || !nombre.trim()) {
      errores.nombre = "El nombre es obligatorio.";
    }else if (nombre.trim().length < 3) {
      errores.nombre = "El nombre debe tener al menos 3 letras.";
    }

    if (!apellido_paterno || !apellido_paterno.trim()) {
      errores.apellido_paterno = "El apellido paterno es obligatorio.";
    }else if (apellido_paterno.trim().length < 3) {
      errores.apellido_paterno = "El apellido paterno debe tener al menos 3 letras.";
    } 

    if (!apellido_materno || !apellido_materno.trim()) {
      errores.apellido_materno = "El apellido materno es obligatorio.";
    }else if (apellido_materno.trim().length < 3) {
      errores.apellido_materno = "El apellido materno debe tener al menos 3 letras.";
    }

    if (!telefono || telefono.length !== 10 || !/^\d+$/.test(telefono)) {
      errores.telefono = "El teléfono debe tener 10 dígitos numéricos.";
    }

    if (!ubicacion || !ubicacion.trim()) {
      errores.ubicacion = "La ubicación es obligatoria.";
    }

    if (!genero || !['H', 'M'].includes(genero)) {
      errores.genero = "El género debe ser 'H' (hombre) o 'M' (mujer).";
    }    

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }
    // Verificar si ya existe usuario con ese teléfono
    const existeTelefono = await Usuario.findOne({ where: { telefono } });
    if (existeTelefono) {
      return res.status(400).json({ errores: { telefono: "Intenta con otro teléfono." } });
    }

    const hash = await bcrypt.hash(password, 10);

    const nuevoEmpleado = await Usuario.create({
      nombre_usuario: correo.split("@")[0] + Math.floor(Math.random() * 10000),
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      password: hash,
      telefono,
      ubicacion,
      genero,
      rol: 'empleado',
    });

    // Marcar invitación como usada
    invitacion.estado = 'usada';
    await invitacion.save();

    return res.status(201).json({
      mensaje: "Empleado registrado exitosamente.",
      empleado: nuevoEmpleado,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
export const recuperarPasswordEmpleado = async (req, res) => {
  try {
    const { correo } = req.body;
    const empleado = await Usuario.findOne({ where: { correo, rol: 'empleado' } });
    if (!empleado) return res.status(400).json({ mensaje: "Correo no encontrado." });

    const token = crearTokenRecuperacion(empleado);
    empleado.tokenRecuperacion = token;
    await empleado.save();

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
      from: `"Punto Shein" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Recuperación de contraseña',
      html: `
        <p>Hola ${empleado.nombre},</p>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${process.env.FRONTEND_URL}/restablecerPasswordEmpleado?token=${token}">Restablecer Contraseña</a>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ mensaje: "Correo enviado correctamente." });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al enviar el correo." });
  }
};
export const restablecerPasswordEmpleado = async (req, res) => {
  try {
    const { token, nuevaContrasena } = req.body;
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const empleado = await Usuario.findOne({ where: { tokenRecuperacion: token, rol: 'empleado' } });

    if (!empleado) return res.status(400).json({ mensaje: "Token inválido o expirado." });

    const hash = await bcrypt.hash(nuevaContrasena, 10);
    empleado.password = hash;
    empleado.tokenRecuperacion = null;
    await empleado.save();

    res.status(200).json({ mensaje: "Contraseña actualizada exitosamente." });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al restablecer la contraseña." });
  }
};
export const obtenerPerfilEmpleado = async (req, res) => {
  try {
    const token = req.cookies.tokenEmpleado || req.query.token;
    if (!token) return res.status(401).json({ mensaje: 'Token no encontrado' });

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const empleado = await Usuario.findOne({ where: { id: decoded.id, rol: 'empleado' } });

    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado." });

    res.status(200).json({
      id: empleado.id,
      nombre: empleado.nombre,
      correo: empleado.correo,
      telefono: empleado.telefono,
      ubicacion: empleado.ubicacion,
      sexo: empleado.sexo,
      rol: empleado.rol,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener el perfil." });
  }
};
export const obtenerInvitaciones = async (req, res) => {
  try {
    const invitaciones = await InvitacionEmpleado.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ invitaciones });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener invitaciones." });
  }
};
export const eliminarInvitacion = async (req, res) => {
  try {
    const { id } = req.params;

    const invitacion = await InvitacionEmpleado.findByPk(id);
    if (!invitacion) {
      return res.status(404).json({ mensaje: "Invitación no encontrada." });
    }

    await invitacion.destroy();
    res.status(200).json({ mensaje: "Invitación eliminada correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la invitación." });
  }
};
export const obtenerCorreoDesdeToken = async (req, res) => {
  try {
    const { token } = req.query;
    const invitacion = await InvitacionEmpleado.findOne({ where: { token } });

    if (!invitacion || invitacion.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: "Invitación no válida o ya utilizada." });
    }

    if (new Date(invitacion.expiracion) < new Date()) {
      return res.status(400).json({ mensaje: "La invitación ha expirado." });
    }

    return res.status(200).json({ correo: invitacion.correo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al validar el token." });
  }
};
export const obtenerEmpleados = async (req, res) => {
  try {
    const empleados = await Usuario.findAll({
      where: { rol: 'empleado' },
      attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'telefono', 'ubicacion', 'genero', 'rol', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ empleados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener los empleados." });
  }
};

