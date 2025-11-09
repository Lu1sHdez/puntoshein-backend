import express from 'express';
import multer from 'multer';
import {obtenerPerfil} from '../controllers/autenticacion.controller.js';
import {
    recuperarPasswordUsuario,
    restablecerPasswordUsuario,
    cambiarPasswordUsuario,
    validarCodigoUsuario,
    subirFotoPerfil,
    actualizarPerfil } from '../controllers/usuario.controller.js';
import { verificarToken, validarRol } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });
const usuario = validarRol(['usuario']);

// Ruta para obtener el perfil del usuario
router.get('/perfil',verificarToken, usuario, obtenerPerfil);
// Ruta para obtener el perfil del usuario
router.put('/perfil', verificarToken, usuario, actualizarPerfil);

// Recuperación por correo (sin login)
router.post('/recuperar-password', recuperarPasswordUsuario);
router.post('/restablecer-password', restablecerPasswordUsuario);

// Cambio desde el perfil (requiere estar logueado)
router.post('/cambiar-password', verificarToken, usuario, cambiarPasswordUsuario);
router.post('/validar-codigo', validarCodigoUsuario);
router.post('/perfil/foto', verificarToken, usuario, upload.single('foto'), subirFotoPerfil);

export default router;  
