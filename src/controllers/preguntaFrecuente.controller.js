import PreguntaFrecuente from '../models/preguntaFrecuente.model.js';
// Crear una nueva pregunta frecuente
export const crearPreguntaFrecuente = async (req, res) => {
  const { pregunta, respuesta } = req.body;

  try {
    // Verifica si la pregunta ya existe
    const preguntaExistente = await PreguntaFrecuente.findOne({
      where: { pregunta },
    });

    if (preguntaExistente) {
      return res.status(400).json({ error: 'La pregunta ya existe' });
    }

    // Crear la nueva pregunta
    const nuevaPregunta = await PreguntaFrecuente.create({
      pregunta,
      respuesta,
    });

    res.status(201).json(nuevaPregunta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la pregunta frecuente' });
  }
};

// Obtener todas las preguntas frecuentes
export const obtenerPreguntasFrecuentes = async (req, res) => {
  try {
    const preguntas = await PreguntaFrecuente.findAll();
    res.status(200).json(preguntas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las preguntas frecuentes' });
  }
};

// Obtener una pregunta frecuente por su ID
export const obtenerPreguntaPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const pregunta = await PreguntaFrecuente.findByPk(id);

    if (!pregunta) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    res.status(200).json(pregunta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la pregunta frecuente' });
  }
};

// Editar una pregunta frecuente por su ID
export const editarPreguntaFrecuente = async (req, res) => {
  const { id } = req.params;
  const { pregunta, respuesta } = req.body;

  try {
    const preguntaExistente = await PreguntaFrecuente.findByPk(id);

    if (!preguntaExistente) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    // Editar la pregunta frecuente
    preguntaExistente.pregunta = pregunta;
    preguntaExistente.respuesta = respuesta;

    await preguntaExistente.save();

    res.status(200).json(preguntaExistente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar la pregunta frecuente' });
  }
};

// Eliminar una pregunta frecuente por su ID
export const eliminarPreguntaFrecuente = async (req, res) => {
  const { id } = req.params;

  try {
    const pregunta = await PreguntaFrecuente.findByPk(id);

    if (!pregunta) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    await pregunta.destroy();

    res.status(200).json({ message: 'Pregunta eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la pregunta frecuente' });
  }
};
