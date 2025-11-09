import Talla from "../models/tallas.model.js";

// Obtener todas las tallas disponibles
export const obtenerTallas = async (req, res) => {
  try {
    const tallas = await Talla.findAll();
    res.json(tallas);
  } catch (error) {
    console.error("Error al obtener tallas:", error);
    res.status(500).json({ mensaje: "Error interno al obtener tallas" });
  }
};
export const crearTalla = async (req, res) =>{
  const {nombre} = req.body;
  if (!nombre) return res.status(400).json({ mensaje: "El nombre es obligatorio" });

  try {
    const tallaExistente = await Talla.findOne({ where: { nombre } });
    if (tallaExistente) {
      return res.status(400).json({ mensaje: "La talla ya existe" });
    }

    const nuevaTalla = await Talla.create({ nombre });
    res.status(201).json(nuevaTalla);
  } catch (error) {
    console.error("Error al crear talla:", error);
    res.status(500).json({ mensaje: "Error interno al crear la talla" });
  }
}
export const actualizarTalla = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const talla = await Talla.findByPk(id);
    if (!talla) return res.status(404).json({ mensaje: "Talla no encontrada" });

    talla.nombre = nombre || talla.nombre;
    await talla.save();
    res.json(talla);
  } catch (error) {
    console.error("Error al actualizar talla:", error);
    res.status(500).json({ mensaje: "Error interno al actualizar talla" });
  }
};
export const eliminarTalla = async (req, res) => {
  const { id } = req.params;

  try {
    const talla = await Talla.findByPk(id);
    if (!talla) return res.status(404).json({ mensaje: "Talla no encontrada" });

    await talla.destroy();
    res.json({ mensaje: "Talla eliminada con éxito" });
  } catch (error) {
    console.error("Error al eliminar talla:", error);
    res.status(500).json({ mensaje: "Error interno al eliminar talla" });
  }
};

