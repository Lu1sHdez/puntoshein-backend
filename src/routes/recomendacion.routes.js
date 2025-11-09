// C:\Users\luishdez\Desktop\puntoshein\backend\src\routes\recomendacion.routes.js
import express from "express";
import { obtenerRecomendacion, obtenerRecomendacionPorId} from "../controllers/recomendacion.controller.js";

const router = express.Router();

router.get("/:producto", obtenerRecomendacion);
router.get("/id/:id", obtenerRecomendacionPorId);

export default router;
