import express from "express";
import { registrarToken } from "../controllers/token.controller.js";

const router = express.Router();

router.post("/registrar-token", registrarToken);

export default router;
