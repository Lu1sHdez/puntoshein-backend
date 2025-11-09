// routes/app/reporte.routes.js
import { Router } from "express";
import { obtenerReporteVentasDetallado , obtenerReportesGenerales } from "../../controllers/app/reporte.controller.js";

const router = Router();

// 🔹 Endpoint para obtener los reportes generales
router.get("/general", obtenerReportesGenerales);
router.get("/ventas", obtenerReporteVentasDetallado);


export default router;
