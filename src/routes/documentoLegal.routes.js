import express from 'express';
import { verificarToken, validarRol } from '../middleware/auth.js';
import {
  obtenerDocumentoPorTipo,
  obtenerTodosDocumentos,
  actualizarDocumento,
  crearDocumento,
} from '../controllers/documentoLegal.controller.js';

const router = express.Router();
const admin = validarRol(['administrador']);

// Crear documento
router.post('/crear', crearDocumento);

// Actualizar documento existente
router.put('/actualizar/:tipo', verificarToken, admin, actualizarDocumento);

// Obtener todos los documentos (solo admin)
router.get('/obtener', verificarToken, admin, obtenerTodosDocumentos);

// Obtener documento por tipo (público)
router.get('/obtener/:tipo', obtenerDocumentoPorTipo);

export default router;
