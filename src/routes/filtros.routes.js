import express from 'express';
import {obtenerCategorias, obtenerSubcategoriasPorCategoria} from '../controllers/categoria.controller.js'
const router = express.Router();

    
router.get('/categorias', obtenerCategorias);

router.get('/subcategorias', obtenerSubcategoriasPorCategoria);

export default router