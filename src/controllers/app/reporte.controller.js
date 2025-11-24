// controllers/app/reporte.controller.js
import { Op, fn, col, literal } from "sequelize";
import Pedido from "../../models/app/pedido.model.js";
import DetallePedido from "../../models/app/detallePedido.model.js";
import Cliente from "../../models/app/cliente.model.js";
import EstadoPedido from "../../models/app/estado.model.js";

export const obtenerReportesGenerales = async (req, res) => {
  try {
    // Obtener pedidos entregados
    const pedidosEntregados = await Pedido.findAll({
      where: { "$EstadoPedido.estado$": "Entregado" },
      include: [
        { model: EstadoPedido, attributes: ["estado"] },
        { model: DetallePedido, attributes: ["nombre_producto", "precio", "costo", "cantidad"] },
      ],
    });

    // Inicialización de variables
    let totalVentas = 0;
    let totalGanancia = 0;
    let productosVendidos = {};

    // Calcular totalVentas, totalGanancia y productosVendidos
    pedidosEntregados.forEach((p) => {
      // Verificar si 'p.total' es un número válido
      const totalPedido = Number(p.total);
      if (!isNaN(totalPedido)) {
        totalVentas += totalPedido;
      }

      p.DetallePedidos.forEach((d) => {
        const precioVenta = Number(d.precio) * d.cantidad;
        const costoCompra = Number(d.costo || 0) * d.cantidad;

        // Verificar que los cálculos no sean NaN
        if (!isNaN(precioVenta) && !isNaN(costoCompra)) {
          totalGanancia += precioVenta - costoCompra;
        }

        // Contar productos más vendidos
        if (!productosVendidos[d.nombre_producto]) {
          productosVendidos[d.nombre_producto] = 0;
        }
        productosVendidos[d.nombre_producto] += d.cantidad;
      });
    });

    // Obtener los 5 productos más vendidos
    const topProductos = Object.entries(productosVendidos)
      .map(([nombre, ventas]) => ({ nombre, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 5);

    // Obtener clientes nuevos (último mes)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const clientesNuevos = await Cliente.count({
      where: { createdAt: { [Op.gte]: inicioMes } },
    });

    const clientesTotales = await Cliente.count();

    // Obtener pedidos entregados y en proceso
    const entregados = pedidosEntregados.length;
    const enProceso = await Pedido.count({
      include: [
        { model: EstadoPedido, where: { estado: { [Op.ne]: "Entregado" } } },
      ],
    });

    // Cálculo del ticket promedio
    const ticketPromedio = entregados
      ? (totalVentas / entregados).toFixed(2)
      : 0;

    // Simulación del cálculo de crecimiento mensual (puedes calcularlo con ventas anteriores)
    const crecimientoMensual = "+8%";  // Aquí podrías integrar una lógica real para calcular el crecimiento

    // Enviar respuesta con los reportes
    res.status(200).json({
      totalVentas: totalVentas.toFixed(2),
      totalGanancia: totalGanancia.toFixed(2),
      ticketPromedio,
      entregados,
      enProceso,
      clientesTotales,
      clientesNuevos,
      topProductos,
      crecimientoMensual,
    });
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

export const obtenerReporteVentasDetallado = async (req, res) => {
  try {
    const { periodo = "general" } = req.query;

    const whereFecha = {};

    const hoy = new Date();
    const inicioSemana = new Date();
    inicioSemana.setDate(hoy.getDate() - 7);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    if (periodo === "dia") {
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
    
      const finDia = new Date();
      finDia.setHours(23, 59, 59, 999);
    
      whereFecha.createdAt = {
        [Op.gte]: inicioDia,
        [Op.lt]: finDia
      };
    } else if (periodo === "semana") {
      whereFecha.createdAt = { [Op.gte]: inicioSemana };
    } else if (periodo === "mes") {
      whereFecha.createdAt = { [Op.gte]: inicioMes };
    }

    // Solo entregados
    const pedidos = await Pedido.findAll({
      where: whereFecha,
      include: [
        {
          model: EstadoPedido,
          where: { estado: "Entregado" },
          attributes: ["estado"]
        },
        {
          model: DetallePedido,
          attributes: ["nombre_producto", "cantidad", "precio", "costo"]
        }
      ],
      order: [["createdAt", "ASC"]]
    });

    // --- ACUMULADORES ---
    let totalVentas = 0;
    let totalGanancia = 0;
    let ventasPorPeriodo = {};
    let productosVendidos = {};

    pedidos.forEach((p) => {
      const fecha = new Date(p.createdAt);

      let clavePeriodo;

      switch (periodo) {
        case "dia":
          clavePeriodo = fecha.toLocaleString("es-MX", { hour: "2-digit" });
          break;

        case "semana":
          clavePeriodo = fecha.toLocaleString("es-MX", { weekday: "short" });
          break;

        case "mes":
          clavePeriodo = fecha.getDate(); // Día numérico del mes
          break;

        case "general":
        default:
          clavePeriodo = fecha.toLocaleString("es-MX", { month: "short" });
      }

      const totalPedido = Number(p.total);
      totalVentas += totalPedido;
      ventasPorPeriodo[clavePeriodo] =
        (ventasPorPeriodo[clavePeriodo] || 0) + totalPedido;

      // Ganancia
      p.DetallePedidos.forEach((d) => {
        const venta = Number(d.precio) * d.cantidad;
        const costo = Number(d.costo || 0) * d.cantidad;
        totalGanancia += venta - costo;

        productosVendidos[d.nombre_producto] =
          (productosVendidos[d.nombre_producto] || 0) + d.cantidad;
      });
    });

    const topProductos = Object.entries(productosVendidos)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    res.status(200).json({
      tipoReporte: periodo,
      totalVentas: totalVentas.toFixed(2),
      totalGanancia: totalGanancia.toFixed(2),
      ventasPorPeriodo,
      topProductos
    });

  } catch (error) {
    console.error("Error en reporte:", error);
    res.status(500).json({ mensaje: "Error interno." });
  }
};
