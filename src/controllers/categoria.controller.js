import Categoria from '../models/categoria.model.js';
import Subcategoria from '../models/subcategoria.model.js'
import Producto from '../models/producto.model.js';

// USADA PARA EL PANEL PRINCIPAL DE PRODUCTOS EN LA PARTE DE FILTROS
export const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      order: [['nombre', 'ASC']]
    });
    res.json(categorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener categorías' });
  }
};

//USADA PARA EL PANEL PRINCIPAL DE PRODUCTOS EN LA PARTE DE FILTROS
export const obtenerSubcategoriasPorCategoria = async (req, res) => {
  const { categoria_id } = req.query;
  
  if (!categoria_id) {
    return res.status(400).json({ mensaje: 'Se requiere categoria_id' });
  }

  try {
    const subcategorias = await Subcategoria.findAll({
      where: { categoria_id },
      order: [['nombre', 'ASC']]
    });
    res.json(subcategorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener subcategorías' });
  }
};

// Crear una nueva categoría
export const crearCategoria = async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ mensaje: 'El nombre es requerido' });
  }

  try {
    // Verificar si ya existe
    const existeCategoria = await Categoria.findOne({ where: { nombre } });
    if (existeCategoria) {
      return res.status(400).json({ mensaje: 'Esta categoría ya existe' });
    }

    const nuevaCategoria = await Categoria.create({ nombre });
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la categoría' });
  }
};

// Crear una nueva subcategoría
export const crearSubcategoria = async (req, res) => {
  const { nombre, categoria_id } = req.body;

  if (!nombre || !categoria_id) {
    return res.status(400).json({ mensaje: 'Nombre y categoría son requeridos' });
  }

  try {
    // Verificar si la categoría existe
    const categoria = await Categoria.findByPk(categoria_id);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    // Verificar si la subcategoría ya existe
    const existeSubcategoria = await Subcategoria.findOne({ 
      where: { nombre, categoria_id } 
    });
    if (existeSubcategoria) {
      return res.status(400).json({ mensaje: 'Esta subcategoría ya existe para esta categoría' });
    }

    const nuevaSubcategoria = await Subcategoria.create({ nombre, categoria_id });
    res.status(201).json(nuevaSubcategoria);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la subcategoría' });
  }
};
// Eliminar categoría solo si no tiene relaciones
export const eliminarCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    const subcategorias = await Subcategoria.findAll({ where: { categoria_id: id } });
    if (subcategorias.length > 0) {
      return res.status(400).json({ mensaje: 'No se puede eliminar: tiene subcategorías asociadas' });
    }

    const productos = await Producto.findAll({
      include: { model: Subcategoria, where: { categoria_id: id } }
    });
    if (productos.length > 0) {
      return res.status(400).json({ mensaje: 'No se puede eliminar: hay productos en esta categoría' });
    }

    await Categoria.destroy({ where: { id } });
    res.json({ mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar categoría' });
  }
};

export const eliminarSubcategoria = async (req, res) => {
  const { id } = req.params;

  try {
    const productos = await Producto.findAll({ where: { subcategoria_id: id } });
    if (productos.length > 0) {
      return res.status(400).json({ mensaje: 'No se puede eliminar: hay productos en esta subcategoría' });
    }

    await Subcategoria.destroy({ where: { id } });
    res.json({ mensaje: 'Subcategoría eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar subcategoría' });
  }
};

// Editar categoría
export const editarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const existe = await Categoria.findOne({ where: { nombre } });
    if (existe && existe.id != id) {
      return res.status(400).json({ mensaje: 'Ya existe otra categoría con ese nombre' });
    }

    const categoria = await Categoria.findByPk(id);
    if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada' });

    categoria.nombre = nombre;
    await categoria.save();

    res.json({ mensaje: 'Categoría actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al editar la categoría' });
  }
};

// Editar subcategoría
export const editarSubcategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const existe = await Subcategoria.findOne({ where: { nombre } });
    if (existe && existe.id != id) {
      return res.status(400).json({ mensaje: 'Ya existe otra subcategoría con ese nombre' });
    }

    const subcategoria = await Subcategoria.findByPk(id);
    if (!subcategoria) return res.status(404).json({ mensaje: 'Subcategoría no encontrada' });

    subcategoria.nombre = nombre;
    await subcategoria.save();

    res.json({ mensaje: 'Subcategoría actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al editar la subcategoría' });
  }
};