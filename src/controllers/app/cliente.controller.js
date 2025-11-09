//src\controllers\app\cliente.controller.js
import Cliente from "../../models/app/cliente.model.js";

// Registrar nuevo cliente
export const registrarCliente = async (req, res) => {
  try {
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      telefono,
      correo,
      direccion,
      genero,
    } = req.body;

    if (!nombre || !apellido_paterno || !telefono) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios: nombre, apellido paterno o teléfono.",
      });
    }

    // Validar formato de teléfono
    if (!/^\d{10}$/.test(telefono)) {
      return res.status(400).json({
        mensaje: "El número de teléfono debe contener exactamente 10 dígitos.",
      });
    }

    // Verificar duplicado
    const existente = await Cliente.findOne({ where: { telefono } });
    if (existente) {
      return res.status(400).json({
        mensaje: "Ya existe un cliente registrado con este teléfono.",
      });
    }

    const nuevoCliente = await Cliente.create({
      nombre,
      apellido_paterno,
      apellido_materno,
      telefono,
      correo,
      direccion,
      genero: genero || "Otro",
    });

    return res.status(201).json({
      mensaje: "Cliente registrado correctamente.",
      cliente: nuevoCliente,
    });
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    return res.status(500).json({
      mensaje: "Error interno del servidor.",
      error: error.message,
    });
  }
};

// Obtener todos los clientes
export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(clientes);
  } catch (error) {
    console.error("Error al listar clientes:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
};
