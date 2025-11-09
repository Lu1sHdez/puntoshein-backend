import express from "express";
import { obtenerTallas, crearTalla, actualizarTalla, eliminarTalla} from "../controllers/talla.controller.js";
import { verificarToken, validarRol } from "../middleware/auth.js";

const router = express.Router();
const admin = validarRol(['administrador']); // Sólo administradores

// Ruta para obtener tallas
router.get("/obtener", verificarToken, admin, obtenerTallas);
router.post("/crear", verificarToken, admin, crearTalla);
router.put("/:id", actualizarTalla);
router.delete("/:id", eliminarTalla);

export default router;
