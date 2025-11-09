//backend\src\libs\crearTokenAcceso.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Cargar variables de entorno

export const crearTokenAcceso = (usuario) => {
  let expiracion;

  switch (usuario.rol) {
    case 'administrador':
      expiracion = '6h'; // Solo para prueba
      break;
    case 'empleado':
      expiracion = '8h';
      break;
    case 'usuario':
    default:
      expiracion = '24h';
      break;
  }

  return jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.TOKEN_SECRET,
    { expiresIn: expiracion }
  );
};

export const crearTokenRecuperacion = (usuario) => {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol }, 
    process.env.TOKEN_SECRET, // Clave secreta
    { expiresIn: '5m' } // Expiración de 5 minutos
  );
};
