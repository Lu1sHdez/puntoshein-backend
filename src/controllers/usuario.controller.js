//puntoshein\backend\src\controllers\usuario.controller.js
import Usuario from '../models/usuario.model.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.config.js';
import fs from 'fs';
import nodemailer from 'nodemailer';

export const recuperarPasswordUsuario = async (req, res) => {
  try {
    const { correo } = req.body;

    const usuario = await Usuario.findOne({ where: { correo, rol: 'usuario' } });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Correo no registrado o no corresponde a un usuario." });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 10 * 60 * 1000);

    usuario.codigoCambioPassword = codigo;
    usuario.codigoCambioExpira = expiracion;
    await usuario.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
      from: `"Punto Shein" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Código de recuperación de contraseña',
      html: `
        <p>Hola ${usuario.nombre},</p>
        <p>Tu código de recuperación es:</p>
        <h2>${codigo}</h2>
        <p>Este código expirará en 10 minutos.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) return res.status(500).json({ mensaje: "Error al enviar correo." });
      res.status(200).json({ mensaje: "Código enviado correctamente al correo." });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

export const restablecerPasswordUsuario = async (req, res) => {
  try {
    const { correo, codigo, nuevaContrasena } = req.body;

    const usuario = await Usuario.findOne({ where: { correo, rol: 'usuario' } });
    if (!usuario || usuario.codigoCambioPassword !== codigo) {
      return res.status(400).json({ mensaje: "Código incorrecto o usuario inválido." });
    }

    if (new Date() > new Date(usuario.codigoCambioExpira)) {
      return res.status(400).json({ mensaje: "El código ha expirado." });
    }

    // 🕒 Validar política de espera de 24 horas
    const ultimoCambioPassword = usuario.ultimoCambioPassword ? new Date(usuario.ultimoCambioPassword).getTime() : 0;
    const tiempoActual = Date.now();
    const tiempoLimite = 24 * 60 * 60 * 1000;
    const tiempoRestante = tiempoLimite - (tiempoActual - ultimoCambioPassword);

    if (tiempoRestante > 0) {
      const horasRestantes = Math.floor(tiempoRestante / (1000 * 60 * 60));
      const minutosRestantes = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));

      return res.status(400).json({
        mensaje: `Cambiaste tu contraseña recientemente. Intenta nuevamente en ${horasRestantes} horas y ${minutosRestantes} minutos.`,
      });
    }

    // 🔐 Validar formato de contraseña
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(nuevaContrasena)) {
      return res.status(400).json({
        mensaje: "Contraseña inválida. Debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.",
      });
    }

    usuario.password = await bcrypt.hash(nuevaContrasena, 10);
    usuario.codigoCambioPassword = null;
    usuario.codigoCambioExpira = null;
    usuario.ultimoCambioPassword = new Date();
    await usuario.save();

    res.status(200).json({ mensaje: "Contraseña restablecida correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al restablecer la contraseña." });
  }
};

export const cambiarPasswordUsuario = async (req, res) => {
  try {
    const { actual, nueva, confirmar } = req.body;
    const usuarioId = req.usuario.id;

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario || usuario.rol !== 'usuario') {
      return res.status(403).json({ mensaje: 'Acceso no autorizado.' });
    }

    const validPassword = await bcrypt.compare(actual, usuario.password);
    if (!validPassword) {
      return res.status(400).json({ mensaje: 'Contraseña actual incorrecta.' });
    }

    if (nueva !== confirmar) {
      return res.status(400).json({ mensaje: 'Las contraseñas nuevas no coinciden.' });
    }

    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(nueva)) {
      return res.status(400).json({ mensaje: "Contraseña inválida. Debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo." });
    }

    usuario.password = await bcrypt.hash(nueva, 10);
    usuario.ultimoCambioPassword = new Date();
    await usuario.save();

    res.status(200).json({ mensaje: "Contraseña actualizada correctamente." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cambiar la contraseña." });
  }
};

export const validarCodigoUsuario = async (req, res) => {
  const { correo, codigo } = req.body;

  const usuario = await Usuario.findOne({ where: { correo, rol: 'usuario' } });
  if (!usuario || usuario.codigoCambioPassword !== codigo) {
    return res.status(400).json({ mensaje: "Código incorrecto." });
  }

  if (new Date() > new Date(usuario.codigoCambioExpira)) {
    return res.status(400).json({ mensaje: "El código ha expirado." });
  }

  return res.status(200).json({ mensaje: "Código válido." });
};

export const actualizarPerfil = async (req, res) => {
  try {
    const { nombre_usuario, nombre, apellido_paterno, apellido_materno, telefono, correo } = req.body;
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ mensaje: 'No autorizado, token no encontrado.' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    // Validar correo
    if (correo && !validator.isEmail(correo)) {
      return res.status(400).json({ mensaje: 'Correo electrónico no válido.' });
    }

    // Validar teléfono
    if (telefono && !/^\d{10}$/.test(telefono)) {
      return res.status(400).json({ mensaje: 'El número de teléfono debe tener 10 dígitos.' });
    }

    // Actualizar los campos
    usuario.nombre_usuario = nombre_usuario || usuario.nombre_usuario;
    usuario.nombre = nombre || usuario.nombre;
    usuario.apellido_paterno = apellido_paterno || usuario.apellido_paterno;
    usuario.apellido_materno = apellido_materno || usuario.apellido_materno;
    usuario.telefono = telefono || usuario.telefono;
    usuario.correo = correo || usuario.correo;

    await usuario.save();

    return res.status(200).json({ mensaje: 'Perfil actualizado exitosamente.', usuario });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error interno del servidor.', error: error.message });
  }
};

export const subirFotoPerfil = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ mensaje: 'No se envió ninguna imagen' });
    }

    // ✅ Tomar el ID del middleware
    const usuarioId = req.userId; 
    if (!usuarioId) {
      return res.status(401).json({ mensaje: 'Usuario no autenticado' });
    }

    // Buscar usuario
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'usuarios_perfil',
      public_id: `perfil_${usuarioId}`,
      overwrite: true,
    });

    // Eliminar archivo temporal
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error al eliminar archivo temporal:', err);
    });

    // Actualizar registro en BD
    usuario.foto_perfil = result.secure_url;
    await usuario.save();

    res.status(200).json({
      mensaje: 'Foto de perfil actualizada correctamente',
      foto_perfil: usuario.foto_perfil,
    });
  } catch (error) {
    console.error('Error al subir imagen de perfil:', error);
    res.status(500).json({
      mensaje: 'Error al subir imagen de perfil',
      detalle: error.message,
    });
  }
};