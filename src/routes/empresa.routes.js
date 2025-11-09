// src/routes/empresa.routes.js
import express from 'express';
import multer from 'multer';
import {
  obtenerEmpresa,
  actualizarEmpresa,
  subirLogoEmpresa
} from '../controllers/empresa.controller.js';
import { verificarToken, validarRol } from '../middleware/auth.js';

const router = express.Router();
const admin = validarRol(['administrador']);
const upload = multer({ dest: 'uploads/' });

router.get('/empresa', obtenerEmpresa);

router.put('/empresa', verificarToken, admin, actualizarEmpresa);
router.post('/empresa/logo', verificarToken, admin, upload.single('imagen'), subirLogoEmpresa);

export default router;
