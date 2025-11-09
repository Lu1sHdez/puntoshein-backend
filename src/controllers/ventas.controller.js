import Venta from "../models/ventas.model.js";

export const obtenerVentasPorMes = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { talla_id } = req.query;

    const where = { producto_id };
    if (talla_id) {
      where.talla_id = talla_id;
    }

    const ventas = await Venta.findAll({
      where,
      order: [["fecha_venta", "ASC"]],
    });

    if (ventas.length === 0) {
      return res.status(404).json({ mensaje: "No hay ventas registradas para este producto o talla." });
    }

    const ventasPorMes = {};

    ventas.forEach((venta) => {
      const fecha = new Date(venta.fecha_venta);
      const mes = fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' }); 
      if (!ventasPorMes[mes]) ventasPorMes[mes] = 0;
      ventasPorMes[mes] += venta.cantidad;
    });

    const resultado = Object.entries(ventasPorMes)
    .sort((a, b) => new Date(`01/${a[0]}`) - new Date(`01/${b[0]}`)) // orden por fecha
    .map(([mes, cantidad]) => ({
      mes,
      unidades_vendidas: cantidad,
    }));


    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener ventas por mes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const obtenerVentasSemanales = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { talla_id } = req.query;

    const where = { producto_id };
    if (talla_id) {
      where.talla_id = talla_id;
    }

    const ventas = await Venta.findAll({
      where,
      order: [["fecha_venta", "ASC"]],
    });

    if (ventas.length === 0) {
      return res.status(404).json({ mensaje: "No hay ventas registradas para este producto o talla." });
    }

    const ventasSemanales = {};

    ventas.forEach((venta) => {
      const fechaVenta = new Date(venta.fecha_venta);
      const semana = getWeekNumber(fechaVenta);

      if (!ventasSemanales[semana]) {
        ventasSemanales[semana] = {
          unidades_vendidas: 0,
          fecha: fechaVenta,
        };
      }

      ventasSemanales[semana].unidades_vendidas += venta.cantidad;
    });

    const resultado = Object.entries(ventasSemanales).map(([semana, data]) => ({
      semana: parseInt(semana),
      unidades_vendidas: data.unidades_vendidas,
      fecha: data.fecha.toISOString().split('T')[0]  // Resultado: "2025-03-08"

    }));

    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener ventas semanales:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const obtenerVentasPorDia = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { talla_id } = req.query;

    const where = { producto_id };
    if (talla_id) {
      where.talla_id = talla_id;
    }

    const ventas = await Venta.findAll({
      where,
      order: [["fecha_venta", "ASC"]],
    });

    if (ventas.length === 0) {
      return res.status(404).json({ mensaje: "No hay ventas registradas para este producto o talla." });
    }

    const ventasPorDia = {};

    ventas.forEach((venta) => {
      const fecha = new Date(venta.fecha_venta).toISOString().split('T')[0]; // Formato "2025-03-25"
      if (!ventasPorDia[fecha]) ventasPorDia[fecha] = 0;
      ventasPorDia[fecha] += venta.cantidad;
    });

    const resultado = Object.entries(ventasPorDia).map(([fecha, cantidad]) => ({
      fecha,
      unidades_vendidas: cantidad,
    }));

    res.json(resultado);
  } catch (error) {
    console.error("Error al obtener ventas por día:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
// Función para obtener el número de semana de una fecha
const getWeekNumber = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = Math.floor((date - startOfYear) / 86400000);
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

function calcularK(P0, Pt, t) {
  if (P0 <= 0 || Pt <= 0 || t <= 0) return null;
  return (1 / t) * Math.log(Pt / P0);
}
export const predecirVentasPorDia = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { talla_id } = req.query;

    const where = { producto_id };
    if (talla_id) where.talla_id = talla_id;

    const ventas = await Venta.findAll({ where, order: [['fecha_venta', 'ASC']] });
    if (ventas.length < 1) return res.status(400).json({ mensaje: 'No hay datos suficientes para predecir.' });

    const ventasPorDia = {};
    ventas.forEach(v => {
      const fecha = new Date(v.fecha_venta).toISOString().split('T')[0]; // "2025-03-25"

      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + v.cantidad;
    });

    const fechas = Object.keys(ventasPorDia);
    if (fechas.length < 2) return res.status(400).json({ mensaje: 'Se necesitan al menos dos registros para predecir.' });

    const P0 = ventasPorDia[fechas[0]];
    const Pt = ventasPorDia[fechas[fechas.length - 1]];
    const t = fechas.length - 1;
    const k = calcularK(P0, Pt, t);
    if (!k) return res.status(400).json({ mensaje: 'No se pudo calcular k.' });

    const predicciones = [];
    for (let i = 1; i <= 7; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i);
      const unidades = Math.round(P0 * Math.exp(k * (t + i)));
      predicciones.push({ fecha: fecha.toLocaleDateString("es-MX"), unidades_estimadas: unidades });
    }

    res.json(predicciones);
  } catch (error) {
    console.error("Error al predecir ventas por día:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const predecirVentasPorSemana = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { talla_id } = req.query;

    const where = { producto_id };
    if (talla_id) where.talla_id = talla_id;

    const ventas = await Venta.findAll({ where, order: [['fecha_venta', 'ASC']] });
    if (ventas.length < 1) return res.status(400).json({ mensaje: 'No hay datos suficientes para predecir.' });

    const ventasSemanales = {};
    ventas.forEach(v => {
      const semana = getWeekNumber(new Date(v.fecha_venta));
      ventasSemanales[semana] = (ventasSemanales[semana] || 0) + v.cantidad;
    });

    const semanas = Object.keys(ventasSemanales);
    if (semanas.length < 2) return res.status(400).json({ mensaje: 'Se necesitan al menos dos semanas para predecir.' });

    const P0 = ventasSemanales[semanas[0]];
    const Pt = ventasSemanales[semanas[semanas.length - 1]];
    const t = semanas.length - 1;
    const k = calcularK(P0, Pt, t);
    if (!k) return res.status(400).json({ mensaje: 'No se pudo calcular k.' });

    const predicciones = [];
    for (let i = 1; i <= 4; i++) {
      const unidades = Math.round(P0 * Math.exp(k * (t + i)));
      predicciones.push({ semana: `Semana +${i}`, unidades_estimadas: unidades });
    }

    res.json(predicciones);
  } catch (error) {
    console.error("Error al predecir ventas por semana:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

export const predecirVentasPorMes = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { talla_id } = req.query;

    const where = { producto_id };
    if (talla_id) where.talla_id = talla_id;

    const ventas = await Venta.findAll({ where, order: [['fecha_venta', 'ASC']] });
    if (ventas.length < 1) return res.status(400).json({ mensaje: 'No hay datos suficientes para predecir.' });

    const ventasPorMes = {};
    ventas.forEach(v => {
      const fecha = new Date(v.fecha_venta);
      const mes = `${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
      ventasPorMes[mes] = (ventasPorMes[mes] || 0) + v.cantidad;
    });

    const meses = Object.keys(ventasPorMes);
    if (meses.length < 2) return res.status(400).json({ mensaje: 'Se necesitan al menos dos meses para predecir.' });

    const P0 = ventasPorMes[meses[0]];
    const Pt = ventasPorMes[meses[meses.length - 1]];
    const t = meses.length - 1;
    const k = calcularK(P0, Pt, t);
    if (!k) return res.status(400).json({ mensaje: 'No se pudo calcular k.' });

    const predicciones = [];
    const hoy = new Date();
    for (let i = 1; i <= 3; i++) {
      const fecha = new Date(hoy);
      fecha.setMonth(hoy.getMonth() + i);
      const unidades = Math.round(P0 * Math.exp(k * (t + i)));
      predicciones.push({ mes: `${fecha.getMonth() + 1}/${fecha.getFullYear()}`, unidades_estimadas: unidades });
    }

    res.json(predicciones);
  } catch (error) {
    console.error("Error al predecir ventas por mes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
