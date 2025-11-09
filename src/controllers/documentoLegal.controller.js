import DocumentoLegal from '../models/documentoLegal.model.js';

// === Crear un nuevo documento legal ===
export const crearDocumento = async (req, res) => {
  try {
    const { tipo, titulo, descripcion, contenido } = req.body;

    if (!tipo || !titulo || !descripcion || !contenido) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios." });
    }

    // Verificar si ya existe un documento del mismo tipo
    const existente = await DocumentoLegal.findOne({ where: { tipo } });
    if (existente) {
      return res.status(409).json({ mensaje: "Ya existe un documento de este tipo." });
    }

    const nuevoDocumento = await DocumentoLegal.create({
      tipo,
      titulo,
      descripcion,
      contenido,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date(),
    });

    return res.status(201).json({
      mensaje: "Documento creado correctamente.",
      documento: nuevoDocumento,
    });
  } catch (error) {
    console.error("Error al crear documento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// === Actualizar un documento legal existente ===
export const actualizarDocumento = async (req, res) => {
  try {
    const { tipo } = req.params;
    const { titulo, descripcion, contenido } = req.body;

    // Buscar documento existente
    const documento = await DocumentoLegal.findOne({ where: { tipo } });

    if (!documento) {
      return res.status(404).json({ mensaje: "Documento no encontrado." });
    }

    // Actualizar los campos
    documento.titulo = titulo || documento.titulo;
    documento.descripcion = descripcion || documento.descripcion;
    documento.contenido = contenido || documento.contenido;
    documento.fecha_actualizacion = new Date();

    await documento.save();

    return res.json({
      mensaje: "Documento actualizado correctamente.",
      documento,
    });
  } catch (error) {
    console.error("Error al actualizar documento:", error);
    return res.status(500).json({ mensaje: "Error del servidor." });
  }
};


// === Obtener un documento por tipo (público) ===
export const obtenerDocumentoPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const documento = await DocumentoLegal.findOne({ where: { tipo } });

    if (!documento) {
      return res.status(200).json({ mensaje: "No hay documento de este tipo aún." });
    }

    res.json(documento);
  } catch (error) {
    console.error("Error al obtener documento:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};

// === Obtener todos los documentos (solo admin) ===
export const obtenerTodosDocumentos = async (req, res) => {
  try {
    const documentos = await DocumentoLegal.findAll({
      order: [["fecha_actualizacion", "DESC"]],
    });

    if (documentos.length === 0) {
      return res.status(200).json({ mensaje: "No se encontraron documentos." });
    }

    res.json(documentos);
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
