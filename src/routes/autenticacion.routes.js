import express from 'express';
import { registro,validarDatosPrevios, login, cerrarSesion,actualizarPasswordTelefono, 
    recuperarPassword,restablecerPassword, verificarSoloCodigoTelefono, 
    solicitarRecuperacionTelefono} from '../controllers/autenticacion.controller.js';

const router = express.Router();

router.post('/validar-datos-previos', validarDatosPrevios);

// Ruta para registrar usuarios
router.post('/registro', express.json(), registro);

// Ruta para iniciar sesión
router.post('/login', express.json(), login);

// Ruta para cerrar sesión
router.post('/logout', cerrarSesion);

// Ruta de recuperar contraseña
router.post('/recuperarPassword', express.json(), recuperarPassword);
// Ruta para restablecer contraseña
router.post('/restablecerPassword', express.json(), restablecerPassword);

router.post('/verificar', express.json(), verificarSoloCodigoTelefono);
router.post('/solicitar', express.json(), solicitarRecuperacionTelefono);
router.post('/actualizarPasswordTelefono', express.json(), actualizarPasswordTelefono);


export default router;
