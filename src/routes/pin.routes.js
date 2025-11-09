// routes/pin.routes.js
import express from 'express';
import { generarPin, loginConPin } from '../controllers/pin.controller.js';

const router = express.Router();

router.post('/generar', generarPin); // desde panel web
router.post('/login', loginConPin);  // desde Android

export default router;
