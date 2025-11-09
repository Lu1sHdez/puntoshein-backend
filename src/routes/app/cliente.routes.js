// src/routes/app/cliente.routes.js
import express from "express";
import {
  registrarCliente,
  obtenerClientes,
} from "../../controllers/app/cliente.controller.js";

const router = express.Router();

// POST registrar cliente
router.post("/registrar", registrarCliente);

// GET obtener lista de clientes
router.get("/obtener", obtenerClientes);

export default router;
