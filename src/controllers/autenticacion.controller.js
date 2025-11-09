import Usuario from '../models/usuario.model.js';
import bcrypt from 'bcryptjs';
import { crearTokenAcceso, crearTokenRecuperacion } from '../libs/crearTokenAcceso.js';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import logger from '../libs/logger.js'; 
import twilio from 'twilio';
import axios from 'axios';
import obtenerFechaHora from '../utils/funciones.js';

export const validarDatosPrevios = async (req, res) => {
  try {
    const { correo, nombre, apellido_paterno, apellido_materno, telefono } = req.body;

    const errores = {};

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errores.correo = "El correo no tiene un formato válido.";
    }

    if (!nombre || !nombre.trim()) {
      errores.nombre = "El nombre es obligatorio.";
    } else if (nombre.trim().length < 3) {
      errores.nombre = "El nombre debe tener al menos 3 letras.";
    }

    if (!apellido_paterno || !apellido_paterno.trim()) {
      errores.apellido_paterno = "El apellido paterno es obligatorio.";
    } else if (apellido_paterno.trim().length < 3) {
      errores.apellido_paterno = "El apellido paterno debe tener al menos 3 letras.";
    }

    if (!apellido_materno || !apellido_materno.trim()) {
      errores.apellido_materno = "El apellido materno es obligatorio.";
    } else if (apellido_materno.trim().length < 3) {
      errores.apellido_materno = "El apellido materno debe tener al menos 3 letras.";
    }

    if (!telefono || telefono.length !== 10 || !/^\d+$/.test(telefono)) {
      errores.telefono = "El teléfono debe tener 10 dígitos numéricos.";
    }

    // Verificar existencia
    const correoExistente = await Usuario.findOne({ where: { correo } });
    if (correoExistente) {
      errores.correo = "Intenta con otro correo.";
    }

    const telefonoExistente = await Usuario.findOne({ where: { telefono } });
    if (telefonoExistente) {
      errores.telefono = "Intenta con otro teléfono.";
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    return res.status(200).json({ success: true, mensaje: "Validación exitosa" });

  } catch (error) {
    logger.error({
      message: error.message,
      level: 'error',
      codigo_error: error.code || '500',
      stack: error.stack,
      ip_cliente: req.ip,
    });
    return res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const registro = async (req, res) => {
  try {
    const { correo, password, nombre, apellido_paterno, apellido_materno, telefono, rol } = req.body;

    const errores = {};

    // Validaciones manuales (igual que en registroEmpleado)

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errores.correo = "El correo no tiene un formato válido.";
    }

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
    } else if (nombre.trim().length < 3) {
      errores.nombre = "El nombre debe tener al menos 3 letras.";
    }

    if (!apellido_paterno || !apellido_paterno.trim()) {
      errores.apellido_paterno = "El apellido paterno es obligatorio.";
    } else if (apellido_paterno.trim().length < 3) {
      errores.apellido_paterno = "El apellido paterno debe tener al menos 3 letras.";
    }

    if (!apellido_materno || !apellido_materno.trim()) {
      errores.apellido_materno = "El apellido materno es obligatorio.";
    } else if (apellido_materno.trim().length < 3) {
      errores.apellido_materno = "El apellido materno debe tener al menos 3 letras.";
    }

    if (!telefono || telefono.length !== 10 || !/^\d+$/.test(telefono)) {
      errores.telefono = "El teléfono debe tener 10 dígitos numéricos.";
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    // Verificar si ya existe usuario con ese correo o teléfono
    const correoExistente = await Usuario.findOne({ where: { correo } });
    if (correoExistente) {
      return res.status(400).json({ errores: { correo: "Intenta con otro correo." } });
    }

    const telefonoExistente = await Usuario.findOne({ where: { telefono } });
    if (telefonoExistente) {
      return res.status(400).json({ errores: { telefono: "Intenta con otro teléfono." } });
    }

    // Generar nombre de usuario automático
    let nombre_usuario = correo.split("@")[0] + Math.floor(Math.random() * 10000);
    while (await Usuario.findOne({ where: { nombre_usuario } })) {
      nombre_usuario = correo.split("@")[0] + Math.floor(Math.random() * 10000);
    }

    const hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre_usuario,
      nombre,
      apellido_paterno,
      apellido_materno,
      correo,
      password: hash,
      telefono,
      rol: rol || 'usuario',
    });

    return res.status(201).json({
      success: true,
      mensaje: "Usuario registrado exitosamente.",
      usuario: {
        id: nuevoUsuario.id,
        nombre_usuario: nuevoUsuario.nombre_usuario,
        nombre: nuevoUsuario.nombre,
        apellido_paterno: nuevoUsuario.apellido_paterno,
        apellido_materno: nuevoUsuario.apellido_materno,
        correo: nuevoUsuario.correo,
        telefono: nuevoUsuario.telefono,
        rol: nuevoUsuario.rol,
        createdAt: nuevoUsuario.createdAt,
      }
    });

  } catch (error) {
    logger.error({
      message: error.message,
      level: 'error',
      codigo_error: error.code || '500',
      stack: error.stack,
      ip_cliente: req.ip,
    });
    return res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    const { correo, password, tokenRecaptcha } = req.body;

    // Validar campos básicos
    if (!correo || !password || !tokenRecaptcha) {
      logger.warn({
        message: "Faltan campos obligatorios",
        level: "warn",
        codigo_error: "400",
        ip_cliente: req.ip,
      });
      return res.status(400).json({ mensaje: "Correo, contraseña y reCAPTCHA son obligatorios." });
    }
    // Verificar el reCAPTCHA con Google
    const verificacion = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET,  // En tu .env
          response: tokenRecaptcha,
        },
      }
    );

    if (!verificacion.data.success) {
      logger.warn({
        message: "Fallo en reCAPTCHA",
        ip_cliente: req.ip,
        score: verificacion.data.score,
      });
      return res.status(400).json({ mensaje: "Verificación de reCAPTCHA fallida." });
    }

    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      const errorMessage = {
        message: "Credenciales inválidas - Usuario no encontrado",
        level: "error",
        codigo_error: "400",
        ip_cliente: req.ip,
        usuario: correo,
      };
      logger.error(errorMessage);
      return res.status(400).json({ mensaje: "Credenciales invalidas" });
    }

    // Comparar la contraseña
    const contraseñaValida = await bcrypt.compare(password, usuario.password);
    if (!contraseñaValida) {
      const errorMessage = {
        message: "Credenciales inválidas - Contraseña incorrecta",
        level: "error",
        codigo_error: "400",
        ip_cliente: req.ip,
        usuario: correo,
      };
      logger.error(errorMessage);
      return res.status(400).json({ mensaje: "Credenciales invalidas" });
    }

    // Generar token JWT
    const token = crearTokenAcceso(usuario);
    const fecha =obtenerFechaHora();

    // Después de generar el token
    logger.info({
      message: "Inicio de sesión exitoso",
      usuario_id: usuario.id,
      correo: usuario.correo,
      ip_cliente: req.ip,
      fecha_hora: fecha
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    

    // Respuesta exitosa
    return res.status(200).json({
      mensaje: "Inicio de sesión exitoso.",
      usuario: {
        id: usuario.id,
        nombre_usuario: usuario.nombre_usuario,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      token,
    });

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    const errorMessage = {
      message: error.message,
      level: 'error',
      codigo_error: error.code || 'No especificado',
      stack: error.stack,
      ip_cliente: req.ip,
    };
    logger.error(errorMessage);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
  
};

export const cerrarSesion = (req, res) => {
  res.cookie('token', '', {
    expires: new Date(0), // Expira inmediatamente
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
  });

  // Antes de devolver la respuesta
  logger.info({
    message: "Sesión cerrada",
    ip_cliente: req.ip,
  });
  return res.json({ mensaje: "Sesión cerrada exitosamente." });
};

export const recuperarPassword = async (req, res) => {
  try {
    const { correo } = req.body;

    // Verificar si el correo existe en la base de datos
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Correo no registrado." });
    }

    // Generar un token único para la recuperación de contraseña
    const tokenRecuperacion = crearTokenRecuperacion(usuario); // Usar la función de token de recuperación

    // Guardar el token en la base de datos
    usuario.tokenRecuperacion = tokenRecuperacion;
    await usuario.save();

    // Después de guardar el token
    logger.info({
      message: "Solicitud de recuperación de contraseña",
      usuario_id: usuario.id,
      correo: usuario.correo,
      ip_cliente: req.ip,
      });

    // Configurar el transporte de correo electrónico
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

    // Crear el mensaje de correo electrónico
    const mailOptions = {
      from: `"Punto Shein" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Recuperación de contraseña',
      html: `
        <p>Hola ${usuario.nombre},</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para continuar:</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/restablecerPassword?token=${tokenRecuperacion}" style="background-color:#007BFF;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">
            Restablecer Contraseña
          </a>
        </p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
    };

    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).json({ mensaje: "Error al enviar el correo." });
      }
      res.status(200).json({ mensaje: "Se han enviado instrucciones a tu correo." });
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

export const restablecerPassword = async (req, res) => {
  try {
    const { token, nuevaContrasena } = req.body;

    // Verificar si el token ha expirado
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(500).json({ mensaje: "El enlace ha expirado. Solicita un nuevo enlace de recuperación." });
    }

    // Verificar si el token es válido y encontrar al usuario
    const usuario = await Usuario.findOne({ where: { tokenRecuperacion: token } });
    if (!usuario) {
      return res.status(500).json({ mensaje: "Token inválido o expirado." });
    }

    
    const ultimoCambioPassword = usuario.ultimoCambioPassword ? new Date(usuario.ultimoCambioPassword).getTime() : 0;
    const tiempoActual = Date.now();
    const tiempoLimite = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

    // Calcular la diferencia de tiempo en milisegundos
    const tiempoRestante = tiempoLimite - (tiempoActual - ultimoCambioPassword);

    // Verificar si el tiempo de espera ha pasado
    if (tiempoRestante > 0) {
      // Calcular el tiempo restante en horas y minutos
      const horasRestantes = Math.floor(tiempoRestante / (1000 * 60 * 60));
      const minutosRestantes = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));

      return res.status(500).json({
        mensaje: `Cambiaste tu contraseña recientemente. Intenta nuevamente en ${horasRestantes} horas y ${minutosRestantes} minutos.`,
      });
    }

    // Validar que la nueva contraseña cumpla con los requisitos
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(nuevaContrasena)) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
      });
    }

    // Hashear la nueva contraseña
    const contraseñaHasheada = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar la contraseña y eliminar el token de recuperación
    usuario.password = contraseñaHasheada;
    usuario.tokenRecuperacion = null;
    usuario.ultimoCambioPassword= new Date();
    await usuario.save();


    // Después de guardar la nueva contraseña
    logger.info({
      message: "Contraseña restablecida",
      usuario_id: usuario.id,
      ip_cliente: req.ip,
      });

    res.status(200).json({ mensaje: "Contraseña restablecida exitosamente." });

  } catch (error) {
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

export const obtenerPerfil = async (req, res) => {
  try {
    const token = req.cookies.token || req.query.token;

    if (!token) {
      return res.status(401).json({ mensaje: 'No autorizado, token no encontrado.' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    // Obtener los datos del usuario usando el ID del payload del token
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    // Devolver los datos del usuario
    return res.status(200).json({
      id: usuario.id,
      nombre_usuario: usuario.nombre_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      nombre: usuario.nombre,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      telefono: usuario.telefono,
      foto_perfil: usuario.foto_perfil || null,
    });
  } catch (error) {
    console.error(error); 
    return res.status(500).json({ mensaje: 'Error interno del servidor.' , error: error.message });
  }
};

export const solicitarRecuperacionTelefono = async (req, res) => {
  try {
    const { telefono } = req.body;

    const usuario = await Usuario.findOne({ where: { telefono } });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Teléfono no registrado." });
    }

    // Generar código de verificación
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Calcular expiración (5 minutos desde ahora)
    const expiracion = new Date(Date.now() + 5 * 60 * 1000);

    usuario.smsCodigo = codigo;
    usuario.smsCodigoExpira = expiracion;
    await usuario.save();

    // Enviar SMS con Twilio
    const client = twilio(process.env.T_ACCOUNT_SID, process.env.T_AUTH_TOKEN);
    await client.messages.create({
      body: `Tu código de recuperación es: ${codigo}`,
      from: process.env.T_PHONE_NUMBER,
      to: `+52${telefono}`, // Asegúrate de tener formato internacional
    });

    res.status(200).json({ mensaje: "Código de verificación enviado por SMS." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al enviar el código por SMS." });
  }
};

export const verificarSoloCodigoTelefono = async (req, res) => {
  try {
    const { telefono, codigo } = req.body;

    const usuario = await Usuario.findOne({ where: { telefono } });
    if (!usuario || !usuario.smsCodigo || !usuario.smsCodigoExpira) {
      return res.status(400).json({ mensaje: "Código no válido o ya expirado." });
    }

    // Verificar expiración
    if (new Date(usuario.smsCodigoExpira) < new Date()) {
      return res.status(400).json({ mensaje: "El código ha expirado. Solicita uno nuevo." });
    }

    if (usuario.smsCodigo !== codigo) {
      return res.status(400).json({ mensaje: "Código incorrecto." });
    }

    res.status(200).json({ mensaje: "Código verificado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al verificar el código." });
  }
};

export const actualizarPasswordTelefono = async (req, res) => {
  try {
    const { telefono, codigo, nuevaContrasena, confirmarContrasena } = req.body;

    if (!telefono || !codigo || !nuevaContrasena || !confirmarContrasena) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }

    if (nuevaContrasena !== confirmarContrasena) {
      return res.status(400).json({ mensaje: "Las contraseñas no coinciden." });
    }

    if (!/^\d{10}$/.test(telefono)) {
      return res.status(400).json({ mensaje: "El teléfono debe tener exactamente 10 dígitos numéricos." });
    }

    if (!/^\d{6}$/.test(codigo)) {
      return res.status(400).json({ mensaje: "El código debe tener exactamente 6 dígitos." });
    }

    const regexPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!regexPassword.test(nuevaContrasena)) {
      return res.status(400).json({
        mensaje:
          "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.",
      });
    }

    const usuario = await Usuario.findOne({ where: { telefono } });
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado con ese número de teléfono." });
    }

    if (!usuario.smsCodigo || !usuario.smsCodigoExpira) {
      return res.status(400).json({ mensaje: "No se ha solicitado código o ya expiró." });
    }

    if (new Date(usuario.smsCodigoExpira) < new Date()) {
      return res.status(400).json({ mensaje: "El código ha expirado. Solicita uno nuevo." });
    }

    if (usuario.smsCodigo !== codigo) {
      return res.status(400).json({ mensaje: "Código incorrecto." });
    }

    const ultimoCambioPassword = usuario.ultimoCambioPassword
      ? new Date(usuario.ultimoCambioPassword).getTime()
      : 0;
    const tiempoActual = Date.now();
    const tiempoLimite = 24 * 60 * 60 * 1000;

    const tiempoRestante = tiempoLimite - (tiempoActual - ultimoCambioPassword);
    if (tiempoRestante > 0) {
      const horasRestantes = Math.floor(tiempoRestante / (1000 * 60 * 60));
      const minutosRestantes = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
      return res.status(400).json({
        mensaje: `Ya cambiaste tu contraseña recientemente. Intenta nuevamente en ${horasRestantes}h ${minutosRestantes}m.`,
      });
    }

    const contraseñaHasheada = await bcrypt.hash(nuevaContrasena, 10);
    usuario.password = contraseñaHasheada;
    usuario.smsCodigo = null;
    usuario.smsCodigoExpira = null;
    usuario.ultimoCambioPassword = new Date();
    await usuario.save();

    return res.status(200).json({ mensaje: "Contraseña actualizada exitosamente." });

  } catch (error) {
    console.error("Error actualizando contraseña:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

