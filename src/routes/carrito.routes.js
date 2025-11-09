import express from 'express';
import { verificarToken, validarRol } from '../middleware/auth.js';
import {
  agregarAlCarrito,
  obtenerCarrito,
  eliminarDelCarrito,
  vaciarCarrito,
  actualizarCantidad,
  obtenerCantidad
} from "../controllers/carrito.controller.js";

const router = express.Router();
const usuarios = validarRol(['usuario', 'empleado', 'administrador']);

router.post("/agregar", verificarToken, usuarios, agregarAlCarrito);
router.get("/:usuario_id",  obtenerCarrito);
router.delete("/eliminar", verificarToken, usuarios, eliminarDelCarrito);
router.delete("/vaciar", verificarToken, usuarios, vaciarCarrito);
router.put("/actualizarCantidad", verificarToken, usuarios, actualizarCantidad)
router.get("/cantidad/:usuario_id", verificarToken, usuarios, obtenerCantidad)

export default router;
