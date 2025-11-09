import express from 'express';
import { verificarToken, validarRol } from '../middleware/auth.js';
import multer from 'multer';
import { 
    buscarProductos, allProductos, obtenerProductoPorId, 
    filtrarProductos, obtenerProductosPorSubcategoria, obtenerDetalleProductoPorTalla, 
    resumenStock, notificaciones, subirImagenProducto, 
    obtenerProductos, eliminarProducto, crearProducto, editarProducto, obtenerProducto_Id, 
    buscarProductoPorNombre,
    buscarProductoPorSlug
} from '../controllers/producto.controller.js';

import {obtenerCategorias, obtenerSubcategoriasPorCategoria,  crearCategoria,
    crearSubcategoria,eliminarCategoria, eliminarSubcategoria, editarCategoria, editarSubcategoria} from '../controllers/categoria.controller.js'

const admin = validarRol(['administrador']);
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Subir imagen para productos
router.post('/producto/imagen', verificarToken, admin, upload.single('imagen'), subirImagenProducto);

// Rutas CRUD para categorías
router.get('/categorias', obtenerCategorias);
router.post('/categorias', verificarToken, admin, crearCategoria);
router.put('/categorias/:id', verificarToken, admin, editarCategoria);
router.delete('/categorias/:id', verificarToken, admin, eliminarCategoria);

// Rutas CRUD para subcategorías
router.get('/subcategorias', obtenerSubcategoriasPorCategoria);
router.post('/subcategorias', verificarToken, admin, crearSubcategoria);
router.put('/subcategorias/:id', verificarToken, admin, editarSubcategoria);
router.delete('/subcategorias/:id', verificarToken, admin, eliminarSubcategoria);


router.delete('/eliminar/:id', eliminarProducto);
router.get('/productosPorSubcategoria', obtenerProductosPorSubcategoria);
router.get('/detallePorTalla', obtenerDetalleProductoPorTalla);

// Rutas para productos
router.get('/filtrar', filtrarProductos);
router.get('/buscar', buscarProductos);
router.get('/buscar/:slug', buscarProductoPorSlug);

router.get('/allProductos', allProductos);
router.get('/notificaciones', notificaciones);
router.get('/resumen-stock', resumenStock);
router.get('/obtener', obtenerProductos);  
router.get('/obtener/:id', obtenerProducto_Id);  
router.get('/buscar/:nombre', buscarProductoPorNombre)
router.get('/productos/:id', obtenerProductoPorId); 
router.post('/crear',verificarToken, admin, crearProducto); 
router.put('/productos/:id', editarProducto);
router.delete('/eliminar/:id', eliminarProducto);

export default router;
