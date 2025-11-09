// controllers/app/reporte.controller.js
import { Op, fn, col, literal } from "sequelize";
import Pedido from "../../models/app/pedido.model.js";
import DetallePedido from "../../models/app/detallePedido.model.js";
import Cliente from "../../models/app/cliente.model.js";
import EstadoPedido from "../../models/app/estado.model.js";

export const obtenerReportesGenerales = async (req, res) => {
    try {
      // Ventas totales y ganancias
      const pedidosEntregados = await Pedido.findAll({
        where: { "$EstadoPedido.estado$": "Entregado" },
        include: [
          { model: EstadoPedido, attributes: ["estado"] },
          { model: DetallePedido, attributes: ["nombre_producto", "precio", "costo", "cantidad"] },
        ],
      });
  
      let totalVentas = 0;
      let totalGanancia = 0;
      let productosVendidos = {};
  
      pedidosEntregados.forEach((p) => {
        totalVentas += Number(p.total);
        p.DetallePedidos.forEach((d) => {
          const precioVenta = Number(d.precio) * d.cantidad;
          const costoCompra = Number(d.costo || 0) * d.cantidad;
          totalGanancia += precioVenta - costoCompra;
  
          // Contar productos más vendidos
          if (!productosVendidos[d.nombre_producto]) {
            productosVendidos[d.nombre_producto] = 0;
          }
          productosVendidos[d.nombre_producto] += d.cantidad;
        });
      });
  
      // Top 5 productos más vendidos
      const topProductos = Object.entries(productosVendidos)
        .map(([nombre, ventas]) => ({ nombre, ventas }))
        .sort((a, b) => b.ventas - a.ventas)
        .slice(0, 5);
  
      // Clientes nuevos (último mes)
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const clientesNuevos = await Cliente.count({
        where: { createdAt: { [Op.gte]: inicioMes } },
      });
  
      const clientesTotales = await Cliente.count();
  
      // Pedidos entregados y en proceso
      const entregados = pedidosEntregados.length;
      const enProceso = await Pedido.count({
        include: [
          { model: EstadoPedido, where: { estado: { [Op.ne]: "Entregado" } } },
        ],
      });
  
      // Ticket promedio
      const ticketPromedio = entregados
        ? (totalVentas / entregados).toFixed(2)
        : 0;
  
      // Simular comparación mensual
      const crecimientoMensual = "+8%"; // Puedes calcularlo con ventas previas
  
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

// controllers/app/reporte.controller.js
export const obtenerReporteVentasDetallado = async (req, res) => {
    try {
      // 🔹 Solo pedidos ENTREGADOS (ventas reales)
      const pedidos = await Pedido.findAll({
        include: [
          {
            model: EstadoPedido,
            where: { estado: "Entregado" },
            attributes: ["estado"],
          },
          { model: Cliente, attributes: ["nombre", "apellido_paterno"] },
          {
            model: DetallePedido,
            attributes: ["nombre_producto", "cantidad", "precio", "costo"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
  
      // --- MÉTRICAS GLOBALES ---
      let totalVentas = 0;
      let totalGanancia = 0;
      let ventasPorMes = {};
      let ventasPorMetodo = {};
      let ventasPorEstado = {};
      let productosVendidos = {};
  
      pedidos.forEach((p) => {
        const totalPedido = Number(p.total);
        const estado = p.EstadoPedidos?.[0]?.estado || "Entregado";
        const mes = new Date(p.createdAt).toLocaleString("es-MX", { month: "short" });
        const metodo = p.metodoPago || "Sin especificar";
  
        totalVentas += totalPedido;
  
        // 🔸 Agrupar métricas
        ventasPorMes[mes] = (ventasPorMes[mes] || 0) + totalPedido;
        ventasPorMetodo[metodo] = (ventasPorMetodo[metodo] || 0) + totalPedido;
        ventasPorEstado[estado] = (ventasPorEstado[estado] || 0) + 1;
  
        // 🔸 Calcular ganancia por detalle
        p.DetallePedidos.forEach((d) => {
          const precioVenta = Number(d.precio) * d.cantidad;
          const costoCompra = Number(d.costo || 0) * d.cantidad;
          totalGanancia += precioVenta - costoCompra;
  
          // Contar productos
          productosVendidos[d.nombre_producto] =
            (productosVendidos[d.nombre_producto] || 0) + d.cantidad;
        });
      });
  
      const topProductos = Object.entries(productosVendidos)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);
  
      res.status(200).json({
        tipoReporte: "ventasEntregadas",
        totalVentas: totalVentas.toFixed(2),
        totalGanancia: totalGanancia.toFixed(2),
        ventasPorMes,
        ventasPorMetodo,
        ventasPorEstado,
        topProductos,
      });
    } catch (error) {
      console.error("Error al generar reporte detallado:", error);
      res.status(500).json({ mensaje: "Error interno del servidor." });
    }
  };
  