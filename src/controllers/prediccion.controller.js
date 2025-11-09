import Prediccion from "../models/prediccion.model.js";
import Producto from "../models/producto.model.js"; // 🔥 Importa el modelo de producto

export const obtenerPredicciones = async (req, res) => {
  try {
    const predicciones = await Prediccion.findAll();

    const agrupadas = {};

    // Consulta previa de todos los productos necesarios (mejor performance que consultar uno por uno)
    const productos = await Producto.findAll({
      attributes: ['id', 'stock', 'imagen'],
    });

    const stockMap = {};
    productos.forEach(prod => {
      stockMap[prod.id] ={
        stock: prod.stock,
        imagen: prod.imagen,
      } 
    });

    predicciones.forEach(pred => {
      const pid = pred.producto_id;

      if (!agrupadas[pid]) {
        agrupadas[pid] = {
          producto_id: pid,
          producto_nombre: pred.producto_nombre,
          stock_actual: stockMap[pid]?.stock ?? null,  // ← solo el número
          imagen: stockMap[pid]?.imagen ?? null, 
          predicciones: [],
        };
      }

      agrupadas[pid].predicciones.push({
        semana: pred.semana_prediccion,
        fecha_estimada: pred.fecha_prediccion,
        demanda_predicha: parseFloat(pred.demanda_predicha),
      });
    });

    res.json(Object.values(agrupadas));
  } catch (error) {
    console.error("Error al obtener predicciones:", error);
    res.status(500).json({ mensaje: "Error al obtener predicciones de demanda" });
  }
};
