import { Op } from "sequelize";
import Pedido from "../../models/app/pedido.model.js";
import DetallePedido from "../../models/app/detallePedido.model.js";
import Cliente from "../../models/app/cliente.model.js";
import EstadoPedido from "../../models/app/estado.model.js";

export const registrarPedido = async (req, res) => {
  const { clienteId, productos, total, anticipo, restante, metodoPago } = req.body;

  console.log("=== DEBUG REGISTRAR PEDIDO ===");
  console.log("clienteId:", clienteId);
  console.log("total:", total);
  console.log("anticipo:", anticipo);
  console.log("restante:", restante);
  console.log("metodoPago:", metodoPago);
  console.log("productos:", productos);

  try {
    // Validaciones base
    if (!clienteId || !productos || productos.length === 0) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios: clienteId o productos.",
      });
    }

    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado." });
    }

    // Calcular el total si no viene desde el frontend
    const totalCalculado =
      total ||
      productos.reduce((acc, p) => acc + Number(p.precio) * Number(p.cantidad), 0);

    // === Validación y normalización del pago ===
    let anticipoFinal = Number(anticipo) || 0;
    let restanteFinal = Number(restante) || 0;
    let metodoPagoFinal = metodoPago || "Anticipo 50%";

    // Si no se envía método o valores coherentes, el backend ajusta
    const minimoAnticipo = totalCalculado * 0.5;

    if (anticipoFinal < minimoAnticipo) {
      return res.status(400).json({
        mensaje: `El anticipo no puede ser menor al 50% del total. Mínimo: $${minimoAnticipo.toFixed(2)}`,
      });
    }

    if (anticipoFinal > totalCalculado) {
      return res.status(400).json({
        mensaje: `El anticipo no puede ser mayor al total del pedido. Total: $${totalCalculado.toFixed(2)}`,
      });
    }

    // Si no se mandó el restante, se calcula automáticamente
    if (!restanteFinal || restanteFinal === 0) {
      restanteFinal = totalCalculado - anticipoFinal;
    }

    // Crear pedido principal
    const pedido = await Pedido.create({
      clienteId: cliente.id,
      total: totalCalculado,
      anticipo: anticipoFinal,
      restante: restanteFinal,
      metodoPago: metodoPagoFinal,
    });

    await EstadoPedido.create({
      pedidoId: pedido.id,
      estado: "Por hacer",
      observaciones: "Pedido registrado correctamente.",
    });

    // Crear detalles del pedido
    for (const producto of productos) {
      await DetallePedido.create({
        pedidoId: pedido.id,
        nombre_producto: producto.nombre,
        incluyeTalla: producto.incluyeTalla || false,
        talla: producto.talla || null,
        cantidad: producto.cantidad,
        costo: producto.costo || 0,
        precio: producto.precio,
        total: producto.precio * producto.cantidad,
      });
    }

    return res.status(201).json({
      mensaje: "Pedido registrado correctamente.",
      pedido: {
        id: pedido.id,
        clienteId: cliente.id,
        total: totalCalculado,
        anticipo: anticipoFinal,
        restante: restanteFinal,
        metodoPago: metodoPagoFinal,
        estado: "Por hacer",
      },
    });
  } catch (error) {
    console.error("Error al registrar pedido:", error);
    return res.status(500).json({
      mensaje: "Error interno del servidor.",
      error: error.message,
    });
  }
};

export const obtenerPedidosPorEstado = async (req, res) => {
  const { estado } = req.params; // Ejemplo: "Por hacer"

  try {
    // 🔹 Si se piden los "Por hacer", incluir también los "Parcial"
    const estadosFiltrar =
      estado === "Por hacer" ? ["Por hacer", "Parcial"] : [estado];

    const pedidos = await Pedido.findAll({
      include: [
        {
          model: EstadoPedido,
          where: {
            estado: { [Op.in]: estadosFiltrar },
          },
          attributes: ["estado", "observaciones", "createdAt"],
        },
        {
          model: Cliente,
          attributes: ["id", "nombre", "apellido_paterno", "telefono"],
        },
        {
          model: DetallePedido,
          attributes: [
            "id",
            "nombre_producto",
            "talla",
            "cantidad",
            "precio",
            "total",
            "completado",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!pedidos || pedidos.length === 0) {
      return res.status(200).json([]); // devuelve lista vacía, no error
    }

    res.status(200).json(pedidos);
  } catch (error) {
    console.error("Error al obtener pedidos por estado:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor.",
      error: error.message,
    });
  }
};

export const marcarProductoComoCompletado = async (req, res) => {
  const { id } = req.params;
  const { completado } = req.body;

  try {
    const detalle = await DetallePedido.findByPk(id);
    if (!detalle) {
      return res.status(404).json({ mensaje: "Producto no encontrado." });
    }

    detalle.completado = completado;
    await detalle.save();

    // Verifica el estado general del pedido
    const pedido = await Pedido.findByPk(detalle.pedidoId, { include: DetallePedido });
    const totalProductos = pedido.DetallePedidos.length;
    const completados = pedido.DetallePedidos.filter((p) => p.completado).length;

    const estado = await EstadoPedido.findOne({ where: { pedidoId: pedido.id } });
    if (completados === totalProductos) {
      estado.estado = "Realizados";
    } else if (completados > 0) {
      estado.estado = "Parcial";
    } else {
      estado.estado = "Por hacer";
    }

    await estado.save();

    res.status(200).json({ mensaje: "Producto actualizado correctamente", pedido });
  } catch (error) {
    console.error("Error al marcar producto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor", error: error.message });
  }
};

export const actualizarEstadoPedido = async (req, res) => {
  const { pedidoId } = req.params;
  const { nuevoEstado, metodoPagoFinal, montoPagado, observaciones } = req.body;

  try {
    const pedido = await Pedido.findByPk(pedidoId, { include: EstadoPedido });
    if (!pedido) {
      return res.status(404).json({ mensaje: "Pedido no encontrado." });
    }

    // Validar estado destino
    const estadosValidos = ["Por hacer", "Parcial", "Realizados", "Por entregar", "Entregado"];
    if (!estadosValidos.includes(nuevoEstado)) {
      return res.status(400).json({ mensaje: "Estado no válido." });
    }

    // Si NO es "Entregado", solo actualiza estado y listo
    if (nuevoEstado !== "Entregado") {
      if (pedido.EstadoPedido) {
        pedido.EstadoPedido.estado = nuevoEstado;
        pedido.EstadoPedido.observaciones =
          observaciones || `El estado ha cambiado a ${nuevoEstado}.`;
        await pedido.EstadoPedido.save();
      } else {
        await EstadoPedido.create({
          pedidoId: pedido.id,
          estado: nuevoEstado,
          observaciones: observaciones || `El estado ha cambiado a ${nuevoEstado}.`,
        });
      }

      return res.status(200).json({
        mensaje: `El pedido ha sido actualizado a "${nuevoEstado}".`,
        estado: nuevoEstado,
      });
    }

    // === Flujo especial para ENTREGADO con confirmación de pago ===
    const restanteActual = parseFloat(pedido.restante || 0);
    const anticipoActual = parseFloat(pedido.anticipo || 0);
    const total = parseFloat(pedido.total || 0);
    const pagoFinal = parseFloat(montoPagado || 0);

    // Caso A: no hay deuda → se puede entregar sin monto ni método
    if (restanteActual <= 0) {
      if (pedido.EstadoPedido) {
        pedido.EstadoPedido.estado = "Entregado";
        pedido.EstadoPedido.observaciones = observaciones || "Entregado sin saldo pendiente.";
        await pedido.EstadoPedido.save();
      } else {
        await EstadoPedido.create({
          pedidoId: pedido.id,
          estado: "Entregado",
          observaciones: observaciones || "Entregado sin saldo pendiente.",
        });
      }
      return res.status(200).json({
        mensaje: "Pedido entregado. No había saldo pendiente.",
        pedido,
      });
    }

    // Caso B: sí hay deuda → requerimos pago final
    if (isNaN(pagoFinal) || pagoFinal <= 0) {
      return res.status(400).json({
        mensaje: "Se requiere 'montoPagado' mayor a 0 para completar el pago.",
      });
    }

    if (pagoFinal < restanteActual) {
      return res.status(400).json({
        mensaje: `Pago insuficiente. Restante: $${restanteActual.toFixed(2)}.`,
      });
    }

    // Actualizar montos y método de pago
    pedido.anticipo = anticipoActual + pagoFinal;
    pedido.restante = Math.max(0, total - pedido.anticipo);
    pedido.metodoPago = metodoPagoFinal || pedido.metodoPago || "Efectivo";
    await pedido.save();

    // Cambiar a Entregado
    if (pedido.EstadoPedido) {
      pedido.EstadoPedido.estado = "Entregado";
      pedido.EstadoPedido.observaciones =
        observaciones || "Pago final registrado y pedido entregado.";
      await pedido.EstadoPedido.save();
    } else {
      await EstadoPedido.create({
        pedidoId: pedido.id,
        estado: "Entregado",
        observaciones: observaciones || "Pago final registrado y pedido entregado.",
      });
    }

    return res.status(200).json({
      mensaje: "Pedido entregado y pago completado.",
      pedido,
    });
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    return res.status(500).json({
      mensaje: "Error interno del servidor.",
      error: error.message,
    });
  }
};

export const obtenerActividadesRecientes = async (req, res) => {
  try {
    const actividades = await EstadoPedido.findAll({
      include: [
        {
          model: Pedido,
          attributes: ["id", "total"],
          include: [
            {
              model: Cliente,
              attributes: ["nombre", "apellido_paterno"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 10, // muestra las 10 más recientes
    });

    const data = actividades.map((a) => ({
      id: a.id,
      estado: a.estado,
      observaciones: a.observaciones,
      fecha: a.createdAt,
      cliente:
        a.Pedido?.Cliente?.nombre + " " + (a.Pedido?.Cliente?.apellido_paterno || ""),
      total: a.Pedido?.total || 0,
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener actividades recientes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
export const obtenerResumenPedidos = async (req, res) => {
  try {
    const estados = ["Por hacer", "Parcial", "Realizados", "Por entregar", "Entregado"];

    // Recorremos los estados y contamos cada uno
    const conteos = {};

    for (const estado of estados) {
      const count = await EstadoPedido.count({ where: { estado } });
      conteos[estado] = count;
    }

    return res.status(200).json({
      resumen: [
        { title: "Por hacer", value: conteos["Por hacer"] || 0 },
        { title: "Parcial", value: conteos["Parcial"] || 0 },

        { title: "Realizados", value: conteos["Realizados"] || 0 },
        { title: "Por entregar", value: conteos["Por entregar"] || 0 },
        { title: "Entregados", value: conteos["Entregado"] || 0 },
      ],
    });
  } catch (error) {
    console.error("Error al obtener resumen de pedidos:", error);
    return res.status(500).json({
      mensaje: "Error interno del servidor.",
      error: error.message,
    });
  }
};



