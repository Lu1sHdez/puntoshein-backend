import express from 'express';
import { verificarToken, validarRol } from '../middleware/auth.js';

import { 
  crearPreguntaFrecuente,
  obtenerPreguntasFrecuentes,
  obtenerPreguntaPorId,
  eliminarPreguntaFrecuente,
  editarPreguntaFrecuente
} from '../controllers/preguntaFrecuente.controller.js';


const router = express.Router();

const admin = validarRol(['administrador']);


// Rutas para las preguntas frecuentes
router.post('/crear', verificarToken, admin, crearPreguntaFrecuente); // Crear pregunta frecuente
router.get('/obtener', obtenerPreguntasFrecuentes); // Obtener todas las preguntas frecuentes
router.get('/obtener/:id',  verificarToken, admin, obtenerPreguntaPorId); // Obtener pregunta frecuente por ID
router.put('/editar/:id',  verificarToken, admin, editarPreguntaFrecuente); // Actualizar pregunta frecuente
router.delete('/eliminar/:id',  verificarToken, admin, eliminarPreguntaFrecuente); // Eliminar pregunta frecuente

export default router;
