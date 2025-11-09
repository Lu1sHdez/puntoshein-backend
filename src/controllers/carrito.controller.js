import Carrito from "../models/carrito.model.js";
import Producto from "../models/producto.model.js";
import Talla from "../models/tallas.model.js";
import ProductoTalla from "../models/productoTalla.model.js";

// Función auxiliar para limitar cantidad
const verificarCantidadLimite = (cantidad, stock) => {
  const LIMITE = 5;
  return Math.min(cantidad, LIMITE, stock);
};

export const agregarAlCarrito = async (req, res) => {
  try {
    const { usuario_id, producto_id, cantidad, talla_id } = req.body;

    if (!usuario_id || !producto_id || !talla_id || cantidad < 1) {
      return res.status(400).json({ message: "Datos incompletos o inválidos." });
    }

    // Verificar existencia del producto
    const producto = await Producto.findByPk(producto_id);
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    // Verificar que la talla exista para el producto y obtener el stock
    const productoTalla = await ProductoTalla.findOne({
      where: { producto_id, talla_id }
    });

    if (!productoTalla) {
      return res.status(400).json({ message: "La talla seleccionada no está disponible para este producto." });
    }

    const stockDisponible = productoTalla.stock;
    if (stockDisponible <= 0) {
      return res.status(400).json({ message: "La talla seleccionada está agotada." });
    }

    const cantidadVerificada = verificarCantidadLimite(cantidad, stockDisponible);

    // Verificar si ya existe el ítem en el carrito
    let itemCarrito = await Carrito.findOne({
      where: { usuario_id, producto_id, talla_id },
    });

    if (itemCarrito) {
      // Sumar la nueva cantidad sin superar stock ni límite
      const nuevaCantidad = verificarCantidadLimite(itemCarrito.cantidad + cantidadVerificada, stockDisponible);
      itemCarrito.cantidad = nuevaCantidad;
      await itemCarrito.save();
    } else {
      // Crear nuevo registro
      itemCarrito = await Carrito.create({
        usuario_id,
        producto_id,
        talla_id,
        cantidad: cantidadVerificada,
      });
    }

    res.json({ message: "Producto agregado al carrito", itemCarrito });
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res.status(500).json({ message: "Error al agregar al carrito", error: error.message });
  }
};

export const obtenerCarrito = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const carrito = await Carrito.findAll({
      where: { usuario_id },
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen', 'stock'],
        },
        {
          model: Talla,
          as: "talla",
          attributes: ['id', 'nombre'], // Devuelve talla seleccionada
        }
      ],
    });

    if (carrito.length === 0) {
      return res.status(200).json({ message: "El carrito está vacío." });
    }

    const totalCantidad = carrito.reduce((total, item) => total + item.cantidad, 0);
    const totalPrecio = carrito.reduce(
      (total, item) => total + item.producto.precio * item.cantidad,
      0
    );

    res.json({ 
      carrito, 
      totalCantidad,
      totalPrecio 
    });
  }catch (error) {
    console.error("Error al obtener el carrito:", error); // ← log completo
    res.status(500).json({ message: "Error al obtener el carrito", error: error.message });
  }
  
};

export const vaciarCarrito = async (req, res) => {
  try {
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ message: "ID de usuario no proporcionado." });
    }

    const eliminados = await Carrito.destroy({
      where: { usuario_id },
    });

    res.json({
      message: eliminados > 0 ? "Carrito vaciado" : "El carrito ya estaba vacío",
      eliminados,
    });
  } catch (error) {
    console.error("Error al vaciar el carrito:", error);
    res.status(500).json({ message: "Error al vaciar el carrito", error: error.message });
  }
};

export const eliminarDelCarrito = async (req, res) => {
  try {
    const { usuario_id, producto_id } = req.body;

    // Buscar el producto en el carrito
    const itemCarrito = await Carrito.findOne({
      where: { usuario_id, producto_id },
    });

    if (!itemCarrito) {
      return res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }

    // Eliminar el producto del carrito
    await itemCarrito.destroy();

    res.json({ message: "Producto eliminado del carrito" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar del carrito", error });
  }
};

export const actualizarCantidad = async (req, res) => {
  try {
    const { usuario_id, producto_id, talla_id, cantidad } = req.body;

    if (!usuario_id || !producto_id || !talla_id || cantidad < 1) {
      return res.status(400).json({ message: "Datos incompletos o inválidos" });
    }

    // Buscar el item del carrito
    const itemCarrito = await Carrito.findOne({
      where: { usuario_id, producto_id, talla_id },
      include: [{ model: Talla, as: "talla" }]
    });

    if (!itemCarrito) {
      return res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }

    // Límite de cantidad
    const LIMITE_CANTIDAD = 5;
    const stockDisponible = itemCarrito.talla?.stock || 0;

    const nuevaCantidad = Math.min(cantidad, LIMITE_CANTIDAD, stockDisponible);

    itemCarrito.cantidad = nuevaCantidad;
    await itemCarrito.save();

    res.json({ message: "Cantidad actualizada", itemCarrito });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la cantidad", error });
  }
};


export const obtenerCantidad = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    if (!usuario_id) {
      return res.status(400).json({ message: "ID de usuario no proporcionado." });
    }

    const totalCantidad = await Carrito.sum("cantidad", { where: { usuario_id } });

    // Si el carrito está vacío o el usuario no tiene productos
    res.status(200).json({ cantidad: totalCantidad || 0 });
  } catch (error) {
    console.error("Error al obtener la cantidad total del carrito:", error);
    res.status(500).json({ message: "Error al obtener la cantidad total de productos", error });
  }
};
