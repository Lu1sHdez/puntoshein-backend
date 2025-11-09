import Opinion from '../models/opinion.model.js';

// Crear una nueva opinión
export const crearOpinion = async (req, res) => {
  try {
    const { correo, nombre, mensaje } = req.body;

    // Validación del correo
    if (!correo || !correo.trim()) {
      return res.status(400).json({ errores: { correo: "El correo es obligatorio." } });
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoValido.test(correo)) {
      return res.status(400).json({ errores: { correo: "El formato del correo no es válido." } });
    }
    // Validación del nombre
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ errores: { nombre: "El nombre es obligatorio." } });
    }

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóú\s]+$/;
    if (!soloLetras.test(nombre)) {
      return res.status(400).json({ errores: { nombre: "El nombre solo puede contener letras." } });
    }

    // Validación del mensaje
    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ errores: { mensaje: "El mensaje no puede estar vacío." } });
    }

    if (mensaje.length < 10) {
      return res.status(400).json({ errores: { mensaje: "El mensaje debe tener al menos 10 caracteres." } });
    }

    // Crear opinión
    const nueva = await Opinion.create({ nombre, correo, mensaje });
    res.status(201).json({
      mensaje: "Opinión enviada correctamente.",
      opinion: nueva,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al enviar la opinión." });
  }
};

// Obtener todas las opiniones aprobadas (públicas)
export const obtenerOpinionesAprobadas = async (req, res) => {
  try {
    const opiniones = await Opinion.findAll({ where: { estado: 'aprobada' } });
    res.json(opiniones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener opiniones.' });
  }
};

// Obtener todas las opiniones (modo admin)
export const obtenerTodasOpiniones = async (req, res) => {
  try {
    const opiniones = await Opinion.findAll({ order: [['createdAt', 'DESC']] });
    res.json(opiniones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener opiniones.' });
  }
};

// Aprobar o rechazar una opinión
export const actualizarEstadoOpinion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const opinion = await Opinion.findByPk(id);
    if (!opinion) return res.status(404).json({ mensaje: 'Opinión no encontrada.' });

    opinion.estado = estado;
    await opinion.save();

    res.json({ mensaje: `Opinión ${estado} correctamente.` });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el estado.' });
  }
};
