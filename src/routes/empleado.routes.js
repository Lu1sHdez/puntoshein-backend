import express from 'express';
import { verificarToken, validarRol } from '../middleware/auth.js';
import {
  registroEmpleado,
  recuperarPasswordEmpleado,
  restablecerPasswordEmpleado,
  obtenerPerfilEmpleado,
  obtenerInvitaciones,
  obtenerCorreoDesdeToken,
  eliminarInvitacion,
  obtenerEmpleados,
} from '../controllers/empleado.controller.js';

const router = express.Router();

// Middleware de autenticación y autorización por rol
const admin = validarRol(['administrador']);

// Registro inicial de empleado (vía enlace)
router.post('/registro', registroEmpleado);
router.get('/obtenerCorreoDesdeToken', obtenerCorreoDesdeToken);


// Recuperar contraseña por correo
router.post('/recuperar-password', recuperarPasswordEmpleado);

// Restablecer contraseña con token
router.post('/restablecer-password', restablecerPasswordEmpleado);

// Obtener perfil autenticado (requiere token, no middleware aún)
router.get('/perfil', obtenerPerfilEmpleado);

// Obtener las invitaciones enviadas por el admin
router.get('/invitaciones/obtener', verificarToken, admin, obtenerInvitaciones);
router.delete('/invitaciones/eliminar/:id', verificarToken, admin, eliminarInvitacion);

router.get('/obtener',verificarToken, admin, obtenerEmpleados);


export default router;
