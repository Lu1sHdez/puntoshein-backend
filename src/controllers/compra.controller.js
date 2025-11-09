import Producto from "../models/producto.model.js";
import ProductoTalla from "../models/productoTalla.model.js";
import VentaProducto from "../models/ventaProducto.model.js";
import DetalleOrden from "../models/detalleOrden.model.js";
import Usuario from "../models/usuario.model.js";
import Talla from "../models/tallas.model.js";

// Relacion de ventaProducto a DetalleOrden
VentaProducto.hasMany(DetalleOrden, {
  foreignKey: "orden_id",
  as: "detalles",
});

export const comprarAhora = async (req, res) => {
  try {
    const { producto_id, talla_id, cantidad, usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(401).json({ mensaje: "Usuario no autenticado." });
    }

    const producto = await Producto.findByPk(producto_id);
    if (!producto) {
      return res.status(404).json({ mensaje: "Producto no encontrado." });
    }

    let productoTalla = null;
    if (talla_id) {
      productoTalla = await ProductoTalla.findOne({
        where: { producto_id, talla_id },
      });

      if (!productoTalla || productoTalla.stock < cantidad) {
        return res.status(400).json({ mensaje: "Stock insuficiente o talla no disponible." });
      }
    }

    const venta = await VentaProducto.create({ usuario_id });

    const detalle = await DetalleOrden.create({
      orden_id: venta.id,
      producto_id,
      talla_id,
      cantidad,
      precio_unitario: producto.precio,
    });

    if (productoTalla) {
      productoTalla.stock -= cantidad;
      await productoTalla.save();

      const stockTotal = await ProductoTalla.sum("stock", {
        where: { producto_id },
      });
      producto.stock = stockTotal;
      await producto.save();
    }

    res.json({ mensaje: "Compra realizada correctamente.", venta, detalle });
  } catch (error) {
    console.error("Error al procesar la compra:", error);
    res.status(500).json({ mensaje: "Error interno al procesar la compra." });
  }
};
export const obtenerNumeroVentas = async (req, res) => {
  try {
    // Contar cuántas ventas hay registradas en la tabla ventaProductos
    const totalVentas = await VentaProducto.count();

    res.json({ totalVentas });
  } catch (error) {
    console.error("Error al contar ventas:", error);
    res.status(500).json({ mensaje: "Error al obtener el número de ventas." });
  }
};



export const obtenerVentas = async (req, res) => {
  try {
    const ventas = await VentaProducto.findAll({
      include: [
        {
          model: DetalleOrden,
          as: "detalles",
          include: [
            { model: Producto, as: "producto" },
            { model: Talla, as: "talla" },
          ],
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nombre", "apellido_paterno", "correo"],
        },
      ],
      order: [["fecha_venta", "DESC"]],
    });

    res.json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ mensaje: "Error interno al obtener ventas." });
  }
};

export const obtenerVentasPorUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const ventas = await VentaProducto.findAll({
      where: { usuario_id },
      include: [
        {
          model: DetalleOrden,
          as: "detalles",
          include: [
            { model: Producto, as: "producto" },
            { model: Talla, as: "talla" },
          ],
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nombre", "apellido_paterno", "correo"],
        },
      ],
      order: [["fecha_venta", "DESC"]],
    });

    res.json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas por usuario:", error);
    res.status(500).json({ mensaje: "Error interno al obtener ventas por usuario." });
  }
};