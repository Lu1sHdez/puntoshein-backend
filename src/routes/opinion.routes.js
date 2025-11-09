import express from 'express';
import {
  crearOpinion,
  obtenerOpinionesAprobadas,
  obtenerTodasOpiniones,
  actualizarEstadoOpinion
} from '../controllers/opinion.controller.js';
import { verificarToken, validarRol } from '../middleware/auth.js';

const router = express.Router();
const admin = validarRol(['administrador']);

// Público
router.post('/crear', crearOpinion);
router.get('/aprobadas', obtenerOpinionesAprobadas);

// Solo admin
router.get('/todas', verificarToken, admin, obtenerTodasOpiniones);
router.put('/actualizar/:id', verificarToken, admin, actualizarEstadoOpinion);

export default router;
