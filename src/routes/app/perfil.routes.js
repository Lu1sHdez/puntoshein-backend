// src/routes/app/perfil.routes.js
import { Router } from "express";
import {perfilAdminApp}from "../../controllers/app/auth.controller.js";

const router = Router();

router.get("/obtener", perfilAdminApp);

export default router;
