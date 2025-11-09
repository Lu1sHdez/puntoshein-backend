import Producto from "../models/producto.model.js";
import Categoria from "../models/categoria.model.js";
import Subcategoria from "../models/subcategoria.model.js";
import {Sequelize, Op } from "sequelize";
import ProductoTalla from '../models/productoTalla.model.js';
import Talla from "../models/tallas.model.js";
import Venta from "../models/ventas.model.js";
import TokenDispositivo from "../models/tokenDispositivo.model.js";
import { enviarNotificacionStock } from "../utils/notificaciones.js";
import cloudinary from '../config/cloudinary.config.js';
import fs from 'fs';

// Buscar productos por nombre o descripción (versión completa)
export const buscarProductos = async (req, res) => {
  try {
    const { nombre } = req.query; // /api/productos/buscar?nombre=vestido

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({ mensaje: "Debe proporcionar un término de búsqueda." });
    }

    const productos = await Producto.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.like]: `%${nombre}%` } },
          { descripcion: { [Op.like]: `%${nombre}%` } },
        ],
      },
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ["stock"],
          },
        },
      ],
    });

    if (!productos || productos.length === 0) {
      return res.json([]); // no error, solo lista vacía
    }

    // Normalizar la respuesta con stock total
    const productosConStock = productos.map((producto) => {
      const productoJSON = producto.toJSON();
      let stockTotal = 0;

      productoJSON.tallas = productoJSON.tallas.map((talla) => {
        const stock = talla.ProductoTalla?.stock || 0;
        stockTotal += stock;
        return {
          id: talla.id,
          nombre: talla.nombre,
          stock,
          stockStatus: stock > 0 ? "Disponible" : "Sin stock",
        };
      });

      productoJSON.stock = stockTotal;
      return productoJSON;
    });

    res.json(productosConStock);
  } catch (error) {
    console.error("Error al buscar productos:", error);
    res.status(500).json({ mensaje: "Error al buscar productos." });
  }
};
// Buscar producto por nombre normalizado (slug)
export const buscarProductoPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || slug.trim() === "") {
      return res.status(400).json({ mensaje: "Debe proporcionar un slug válido." });
    }

    // Función para normalizar el nombre (igual que en el frontend)
    const normalizar = (texto) =>
      texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    // Trae todos los productos con relaciones
    const productos = await Producto.findAll({
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: { attributes: ["stock"] },
        },
      ],
    });

    // Busca coincidencia exacta por slug
    const producto = productos.find((p) => normalizar(p.nombre) === slug);

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado." });
    }

    // Calcula el stock total
    const productoJSON = producto.toJSON();
    let stockTotal = 0;
    productoJSON.tallas = productoJSON.tallas.map((talla) => {
      const stock = talla.ProductoTalla?.stock || 0;
      stockTotal += stock;
      return {
        id: talla.id,
        nombre: talla.nombre,
        stock,
        stockStatus: stock > 0 ? "Disponible" : "Sin stock",
      };
    });

    productoJSON.stock = stockTotal;

    res.json(productoJSON);
  } catch (error) {
    console.error("Error al buscar producto por slug:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};


export const allProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      order: Sequelize.literal("RAND()"),
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ['stock'],
          },
        },
      ],
    });

    const productosConStock = productos.filter(producto => {
      let tieneStock = false;

      // Recorremos las tallas de cada producto para verificar si alguna tiene stock
      producto.tallas.forEach(talla => {
        if (talla.stock > 0) {
          talla.stockStatus = 'Disponible';  // Si tiene stock, la marcamos como disponible
          tieneStock = true;
        } else {
          talla.stockStatus = 'Sin stock';  // Si no tiene stock, la marcamos como sin stock
        }
      });

      // Solo devolver el producto si tiene al menos una talla con stock
      return tieneStock;
    });

    res.json(productosConStock);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id, {
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ['stock'],
          },
        },
      ],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    let tieneStock = false;

    // Verificamos las tallas del producto
    producto.tallas.forEach(talla => {
      if (talla.stock > 0) {
        talla.stockStatus = 'Disponible';  // Marcamos como disponible si tiene stock
        tieneStock = true;
      } else {
        talla.stockStatus = 'Sin stock';  // Marcamos como sin stock si no tiene stock
      }
    });

    // Si no tiene stock en ninguna talla, no devolveremos el producto
    if (!tieneStock) {
      return res.status(404).json({ mensaje: "Este producto no está disponible en ninguna talla." });
    }

    res.json(producto);
  } catch (error) {
    console.error("Error al obtener detalles del producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
export const obtenerProducto_Id = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id, {
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ['stock'],
          },
        },
      ],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    let tieneStock = false;

    producto.tallas.forEach(talla => {
      const stock = talla.ProductoTalla?.stock || 0;
      if (stock > 0) {
        talla.setDataValue('stockStatus', 'Disponible');
        talla.setDataValue('stock', stock); // Para que lo tengas plano
        tieneStock = true;
      } else {
        talla.setDataValue('stockStatus', 'Sin stock');
        talla.setDataValue('stock', stock);
      }
    });

    if (!tieneStock) {
      return res.status(404).json({ mensaje: "Este producto no está disponible en ninguna talla." });
    }

    res.json(producto);
  } catch (error) {
    console.error("Error al obtener detalles del producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

//USADA PARA EL PANEL PRINCIPAL DE PRODUCTOS EN LA PARTE DE FILTROS
export const filtrarProductos = async (req, res) => {
  try {
    const { categoria_id, subcategoria_id } = req.query;
    let filtros = {};

    if (categoria_id) {
      filtros["$subcategoria.categoria_id$"] = categoria_id;
    }
    if (subcategoria_id) {
      filtros.subcategoria_id = subcategoria_id;
    }

    const productos = await Producto.findAll({
      where: filtros,
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ['stock'],
          },
        },
      ],
    });

    res.json(productos);
  } catch (error) {
    console.error("Error al filtrar productos:", error);
    res.status(500).json({ mensaje: "Error al filtrar productos." });
  }
};

export const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",  // Incluir la categoría asociada a la subcategoría
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ['stock'],  // Incluir solo el stock asociado a la talla
          },
        },
      ],
    });

    // Modificamos la estructura de la respuesta para incluir la categoría y subcategoría correctamente
    const productosConDetalles = productos.map(producto => {
      const productoJSON = producto.toJSON();
      productoJSON.tallas = productoJSON.tallas.map(talla => ({
        id: talla.id,
        nombre: talla.nombre,
        stock: talla.ProductoTalla.stock,  // Aquí accedemos directamente al stock
      }));

      // Agregar los datos de la categoría y subcategoría
      productoJSON.subcategoria = productoJSON.subcategoria || {};
      productoJSON.subcategoria.categoria = productoJSON.subcategoria.categoria || {};

      return productoJSON;
    });

    res.json(productosConDetalles); // Devolver los productos con subcategoría y categoría
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los productos.' });
  }
};
export const buscarProductoPorNombre = async (req, res) => {
  try {
    const { nombre } = req.params;

    const producto = await Producto.findOne({
      where: {
        nombre: {
          [Op.like]: `%${nombre}%`, // Búsqueda parcial, insensible a mayúsculas
        }
      },
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ['stock'],
          },
        },
      ],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    let tieneStock = false;

    producto.tallas.forEach(talla => {
      const stock = talla.ProductoTalla?.stock || 0;
      if (stock > 0) {
        talla.setDataValue('stockStatus', 'Disponible');
        talla.setDataValue('stock', stock);
        tieneStock = true;
      } else {
        talla.setDataValue('stockStatus', 'Sin stock');
        talla.setDataValue('stock', stock);
      }
    });

    if (!tieneStock) {
      return res.status(404).json({ mensaje: "Este producto no tiene tallas disponibles." });
    }

    res.json(producto);
  } catch (error) {
    console.error("Error al buscar producto por nombre:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const obtenerProductosPorSubcategoria = async (req, res) => {
  try {
    const { subcategoria_id } = req.query;

    if (!subcategoria_id) {
      return res.status(400).json({ mensaje: "Se requiere el ID de la subcategoría." });
    }

    const productos = await Producto.findAll({
      where: { subcategoria_id },
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ['stock'],
          },
        },
      ],
    });

    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos por subcategoría:", error);
    res.status(500).json({ mensaje: "Error al obtener productos por subcategoría." });
  }
};


export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID del producto a eliminar

    // Buscar el producto en la base de datos
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Verificar si el producto está relacionado con alguna venta
    const ventasRelacionadas = await Venta.findOne({ where: { producto_id: id } });
    if (ventasRelacionadas) {
      return res.status(400).json({
        mensaje: 'No se puede eliminar este producto porque está relacionado con una o más ventas.',
      });
    }

    // Eliminar el producto de la base de datos
    await producto.destroy();
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el producto' });
  }
};

export const obtenerDetalleProductoPorTalla = async (req, res) => {
  try {
    const { producto_id, talla_id } = req.query;

    // 1. Obtener el producto
    const producto = await Producto.findByPk(producto_id, {
      include: [
        {
          model: Subcategoria,
          as: "subcategoria",
          include: {
            model: Categoria,
            as: "categoria",
          },
        },
      ],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado" });
    }

    // 2. Obtener la relación con la talla específica (stock)
    const relacion = await ProductoTalla.findOne({
      where: {
        producto_id,
        talla_id,
      },
    });

    if (!relacion) {
      return res.status(404).json({ mensaje: "Talla no asignada al producto" });
    }

    // 3. Obtener la talla (para nombre de la talla)
    const talla = await Talla.findByPk(talla_id);
    if (!talla) {
      return res.status(404).json({ mensaje: "Talla no encontrada" });
    }

    // 4. Agregar el estado de stock a la talla
    const stockStatus = relacion.stock > 0 ? 'Disponible' : 'Sin stock para esta talla';

    // 5. Devolver toda la info del producto + talla y stock específico
    res.json({
      ...producto.toJSON(),
      stock: relacion.stock, // sobrescribimos el stock total con el de la talla seleccionada
      talla: talla.nombre,
      stockStatus,  // Estado de la talla
    });

  } catch (error) {
    console.error("Error al obtener detalle por talla:", error);
    res.status(500).json({ mensaje: "Error interno al obtener detalle del producto" });
  }
};

export const resumenStock = async (req, res) => {
  try {
    const productos = await Producto.findAll();

    let agotados = 0;
    let critico = 0;
    let ok = 0;

    productos.forEach(p => {
      const cantidad = p.stock ?? 0;

      if (cantidad === 0) {
        agotados++;
      } else if (cantidad <= 10) {
        critico++;
      } else {
        ok++;
      }
    });

    res.json({ agotados, critico, ok });
  } catch (error) {
    console.error("Error al obtener resumen de stock:", error);
    res.status(500).json({ mensaje: "Error al obtener resumen de stock" });
  }
};

// Enviar notificaciones automáticas para productos agotados o críticos
export const notificaciones = async (req, res) => {
  try {
    const productos = await Producto.findAll();
    const tokens = await TokenDispositivo.findAll();

    const criticos = productos.filter(p => p.stock > 0 && p.stock <= 5);
    const agotados = productos.filter(p => p.stock === 0);

    if (tokens.length === 0) {
      return res.status(200).json({ mensaje: "No hay dispositivos registrados para enviar notificaciones." });
    }

    for (const { token } of tokens) {
      for (const p of criticos) {
        await enviarNotificacionStock(
          token,
          `⚠️ Stock bajo: ${p.nombre}`,
          `Quedan ${p.stock} unidades`
            );
        
      }

      for (const p of agotados) {
        await enviarNotificacionStock(
          token,
          `🚫 Agotado: ${p.nombre}`,
          `Sin unidades disponibles`
        );
        
      }
    }

    res.status(200).json({
      mensaje: "Notificaciones enviadas",
      criticos: criticos.map(p => p.nombre),
      agotados: agotados.map(p => p.nombre),
    });
  } catch (error) {
    console.error("Error al notificar productos críticos/agotados:", error);
    res.status(500).json({ mensaje: "Error al enviar notificaciones" });
  }
};


export const crearProducto = async (req, res) => {
  const { nombre, descripcion, color, precio, imagen, subcategoria_id, tallas = [] } = req.body;

  try {
    // Buscar subcategoría
    const subcategoria = await Subcategoria.findByPk(subcategoria_id);
    if (!subcategoria) {
      return res.status(404).json({ mensaje: 'Subcategoría no encontrada' });
    }

    // Crear producto con stock inicial en 0
    const nuevoProducto = await Producto.create({
      nombre,
      descripcion,
      color,
      precio,
      imagen,
      stock: 0,  // Inicialmente no asignamos un stock global
      subcategoria_id,
    });

    let stockTotal = 0;

    // Asignar las tallas y su stock
    for (const talla of tallas) {
      const { talla_id, stock } = talla;
      if (talla_id && stock > 0) {  // Solo tallas con stock positivo
        await ProductoTalla.create({
          producto_id: nuevoProducto.id,
          talla_id,
          stock
        });
        stockTotal += stock;  // Sumar el stock total de todas las tallas
      } else if (stock === 0) {
        // Si alguna talla tiene stock 0, mostrar un mensaje de advertencia
        console.warn(`La talla ${talla_id} fue ignorada ya que tiene un stock de 0.`);
      }
    }

    // Actualizar el stock total del producto
    await nuevoProducto.update({ stock: stockTotal });

    // Incluir las tallas en la respuesta
    const productoConTallas = await Producto.findByPk(nuevoProducto.id, {
      include: [
        {
          model: Talla,
          as: "tallas",
          through: {
            attributes: ['stock'],
          },
        },
      ],
    });

    // Modificamos la estructura de la respuesta para eliminar el objeto ProductoTalla
    const productoFinal = productoConTallas.toJSON();
    productoFinal.tallas = productoFinal.tallas.map(talla => ({
      id: talla.id,
      nombre: talla.nombre,
      stock: talla.ProductoTalla.stock,  // stock directo en la talla
    }));

    res.status(201).json({ mensaje: 'Producto creado con tallas', producto: productoFinal });
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({
      mensaje: 'Error al crear el producto',
      detalle: error.message,
    });
  }
};
export const subirImagenProducto = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ mensaje: 'No se envió ninguna imagen' });
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'productos',
      public_id: `producto_${Date.now()}`,
      overwrite: true,
    });

    // Eliminar imagen temporal del servidor
    fs.unlink(file.path, err => {
      if (err) console.error('Error al eliminar archivo temporal:', err);
    });

    res.status(200).json({
      mensaje: 'Imagen subida correctamente',
      imagenUrl: result.secure_url,
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ mensaje: 'Error al subir imagen', error: error.message });
  }
};

export const editarProducto = async (req, res) => {
  const { id } = req.params; // Obtenemos el ID del producto desde los parámetros de la URL
  const { nombre, descripcion, precio, color, imagen, stock, subcategoria_id, tallas = [] } = req.body; // Obtenemos los datos del producto desde el cuerpo de la solicitud

  try {
    // Buscamos el producto por ID
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Actualizamos los campos del producto
    producto.nombre = nombre || producto.nombre;
    producto.descripcion = descripcion || producto.descripcion;
    producto.color = color || producto.color;
    producto.precio = precio || producto.precio;
    producto.imagen = imagen || producto.imagen;
    producto.stock = stock || producto.stock;
    producto.subcategoria_id = subcategoria_id || producto.subcategoria_id;

    // Guardamos los cambios del producto
    await producto.save();

    // Actualizamos las tallas y su stock
    let stockTotal = 0;

    // Eliminar las relaciones de tallas antiguas y añadir las nuevas
    await ProductoTalla.destroy({ where: { producto_id: producto.id } });

    for (const talla of tallas) {
      const { talla_id, stock } = talla;
      if (talla_id && stock > 0) {  // Solo tallas con stock positivo
        await ProductoTalla.create({
          producto_id: producto.id,
          talla_id,
          stock
        });
        stockTotal += stock;  // Sumar el stock total de todas las tallas
      } else if (stock === 0) {
        // Si alguna talla tiene stock 0, mostrar un mensaje de advertencia
        console.warn(`La talla ${talla_id} fue ignorada ya que tiene un stock de 0.`);
      }
    }

    // Actualizar el stock total del producto
    await producto.update({ stock: stockTotal });

    res.status(200).json({ mensaje: 'Producto actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el producto' });
  }
};

