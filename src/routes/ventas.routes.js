import express from 'express';
import { verificarToken, validarRol } from '../middleware/auth.js';
import {
  obtenerVentasSemanales,
  obtenerVentasPorDia,
  obtenerVentasPorMes,
  predecirVentasPorDia,
  predecirVentasPorSemana,
  predecirVentasPorMes
} from '../controllers/ventas.controller.js';

const router = express.Router();
const admin = validarRol(['administrador']);

// Rutas de ventas reales
router.get('/ventaSemanal/:producto_id', /* verificarToken, admin, */ obtenerVentasSemanales);
router.get('/ventasPorDia/:producto_id', verificarToken, admin, obtenerVentasPorDia);
router.get('/ventasPorMes/:producto_id', verificarToken, admin, obtenerVentasPorMes);

// Rutas de predicción
router.get('/prediccion/dia/:producto_id', verificarToken, admin, predecirVentasPorDia);
router.get('/prediccion/semana/:producto_id', verificarToken, admin, predecirVentasPorSemana);
router.get('/prediccion/mes/:producto_id', verificarToken, admin, predecirVentasPorMes);

export default router;
