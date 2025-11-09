import express from "express";
import { loginAdminApp, logoutAdminApp } from "../../controllers/app/auth.controller.js";

const router = express.Router();

router.post("/login", loginAdminApp);
router.post("/logout", logoutAdminApp);

export default router;
