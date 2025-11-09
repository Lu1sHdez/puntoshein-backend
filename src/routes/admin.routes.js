import express from 'express';
import { verificarToken, validarRol } from '../middleware/auth.js';
import multer from 'multer';
import {
  obtenerUsuarios,
  obtenerEmpleados,
  obtenerSoloUsuarios,
  obtenerAdmins,
  eliminarUsuario,
  obtenerUsuarioPorId,
  actualizarRol,
  obtenerRoles,
  recuperarPasswordAdmin,
  restablecerPasswordAdmin,
  cambiarPasswordAdmin,
  validarCodigoAdmin,
  enviarInvitacionEmpleado, obtenerIdsUsuarios
} from '../controllers/admin.controller.js';
import { actualizarPerfil, subirFotoPerfil} from '../controllers/usuario.controller.js';
import { obtenerPerfil } from '../controllers/autenticacion.controller.js';
import {
  crearCategoria,
  crearSubcategoria,
  obtenerSubcategoriasPorCategoria,
  obtenerCategorias
} from '../controllers/categoria.controller.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });
const admin = validarRol(['administrador']);

//router.get('/usuarios', verificarToken, admin, obtenerUsuarios);
router.get('/usuarios', obtenerUsuarios);
router.get('/usuariosID', obtenerIdsUsuarios);
router.get('/empleados', verificarToken, admin, obtenerEmpleados);
router.get('/solo-usuarios', verificarToken, admin, obtenerSoloUsuarios);
router.get('/admins', verificarToken, admin, obtenerAdmins);
router.get('/usuarios/:id', verificarToken, admin, obtenerUsuarioPorId);
router.delete('/usuarios/:id', verificarToken, admin, eliminarUsuario);
router.put('/perfil', verificarToken, admin, actualizarPerfil);
router.get('/perfil', obtenerPerfil);
router.post('/perfil/foto', verificarToken, admin, upload.single('foto'), subirFotoPerfil);

router.get('/categorias', obtenerCategorias);  
router.post('/categorias', verificarToken, admin, crearCategoria); 
router.get('/subcategorias', obtenerSubcategoriasPorCategoria); 
router.post('/subcategorias', verificarToken, admin, crearSubcategoria);

// Rutas para roles
router.put('/usuarios/:id/rol', verificarToken, admin, actualizarRol);
router.get('/roles', verificarToken, admin, obtenerRoles);

router.put('/cambiar-contrasena', express.json(), verificarToken, admin, cambiarPasswordAdmin);  
router.post('/recuperar-password', express.json(), recuperarPasswordAdmin);
router.put('/restablecer-password', express.json(), restablecerPasswordAdmin); 
router.post('/validar-codigo', express.json(), validarCodigoAdmin);

router.post('/enviarInvitacionEmpleado', verificarToken, admin, enviarInvitacionEmpleado);

export default router;
