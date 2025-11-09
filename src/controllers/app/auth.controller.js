import bcrypt from "bcryptjs";
import Usuario from "../../models/usuario.model.js";
import { crearTokenAcceso } from "../../libs/crearTokenAcceso.js";
import jwt from "jsonwebtoken";

//Funcion de login del admin
export const loginAdminApp = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Validar campos
    if (!correo || !password) {
      return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios." });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Credenciales inválidas." });
    }

    // Validar rol
    if (usuario.rol !== "administrador") {
      return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores pueden iniciar sesión." });
    }

    // Validar contraseña
    const contraseñaValida = await bcrypt.compare(password, usuario.password);
    if (!contraseñaValida) {
      return res.status(400).json({ mensaje: "Credenciales inválidas." });
    }

    // Crear token
    const token = crearTokenAcceso(usuario);

    // Enviar respuesta
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
    console.error("Error en loginAdminApp:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

//Funcion de cerrar sesion eliminado de token
export const logoutAdminApp = async (req, res) => {
    try {
      // Si el token se almacena en cookies, se limpia aquí
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      });
  
            return res.status(200).json({ mensaje: "Sesión cerrada correctamente." });
    } catch (error) {
      console.error("Error en logoutAdminApp:", error);
      return res.status(500).json({ mensaje: "Error al cerrar sesión." });
    }
};

//Funcion de obtener el perfil del admin
export const perfilAdminApp = async (req, res) => { 
  try {
    const authHeader = req.headers.authorization; 
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'No autorizado, token no encontrado en el header.' });
    }
  
    const token = authHeader.split(' ')[1]; 
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
  
    const usuario = await Usuario.findByPk(decoded.id);
  
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
  
    if (usuario.rol !== "administrador") {
     return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores pueden acceder a este perfil." });
    }
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
      if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ mensaje: 'Token inválido o expirado. Inicia sesión de nuevo.' });
      }
      console.error("Error en perfilAdminApp:", error); 
      return res.status(500).json({ mensaje: 'Error interno del servidor al obtener el perfil.' });
    }
};