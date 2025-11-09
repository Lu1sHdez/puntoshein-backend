import express from 'express';
import { verificarToken, validarRol } from '../middleware/auth.js';
import {
comprarAhora, obtenerVentas, obtenerVentasPorUsuario, obtenerNumeroVentas
} from "../controllers/compra.controller.js";

const router = express.Router();
const usuarios = validarRol(['usuario', 'empleado', 'administrador']);

//router.post("/comprar", verificarToken, usuarios, comprarAhora);
router.post("/comprar", verificarToken, usuarios, comprarAhora);
router.get("/totalVentas", /* verificarToken, usuarios, */ obtenerNumeroVentas);
router.get("/obtener", /* verificarToken, usuarios, */ obtenerVentas);
router.get("/usuario/:usuario_id", /* verificarToken, usuarios, */ obtenerVentasPorUsuario);



export default router;
