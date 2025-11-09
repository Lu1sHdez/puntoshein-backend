import ReglaAsociacion from '../models/reglaAsociacion.model.js';
import Producto from '../models/producto.model.js';
import DetalleOrden from '../models/detalleOrden.model.js';
import { Op, Sequelize } from 'sequelize';

export const obtenerRecomendacion = async (req, res) => {
  try {
    const producto = req.params.producto.trim(); // limpieza de espacios

    const reglas = await ReglaAsociacion.findAll({
      where: {
        antecedente: { [Op.like]: `%${producto}%` }
      },
      include: [{
        model: Producto,
        as: 'productoConsecuente',
        attributes: ['id', 'nombre', 'precio', 'imagen', 'color']
      }],
      order: [['lift', 'DESC']],
      limit: 10
    });

    res.json({ recomendaciones: reglas });
  } catch (error) {
    console.error('Error en obtenerRecomendacion:', error);
    res.status(500).json({ mensaje: 'Error al obtener recomendaciones' });
  }
};

export const obtenerRecomendacionPorId = async (req, res) => {
  try {
    const productoId = req.params.id;

    const resultado = await DetalleOrden.findOne({
      where: { producto_id: productoId },
      include: [{ model: Producto, as: 'producto', attributes: ['nombre'] }],
      attributes: [[Sequelize.literal(`"producto"."nombre"`), 'nombre']]
    });

    if (!resultado) {
      return res.status(404).json({ mensaje: "Producto no encontrado en ventas." });
    }

    const nombre = resultado.get('nombre')?.trim();

    const reglas = await ReglaAsociacion.findAll({
      where: {
        antecedente: { [Op.like]: `%${nombre}%` }
      },
      include: [{
        model: Producto,
        as: 'productoConsecuente',
        attributes: ['id', 'nombre', 'precio', 'imagen', 'color']
      }],
      order: [['lift', 'DESC']],
      limit: 10
    });

    res.json({ recomendaciones: reglas });
  } catch (error) {
    console.error("Error al obtener recomendaciones por ID:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
