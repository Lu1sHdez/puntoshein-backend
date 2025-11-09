import express from "express";
import { verificarToken, validarRol } from '../middleware/auth.js';
import { obtenerPredicciones } from "../controllers/prediccion.controller.js";

const router = express.Router();

// Middleware de autenticación y autorización por rol
const admin = validarRol(['administrador']);

router.get("/demanda",/* verificarToken, admin,  */obtenerPredicciones);

export default router;
