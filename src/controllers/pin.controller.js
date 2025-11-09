// controllers/pin.controller.js
import Pin from '../models/pin.model.js';
import Usuario from '../models/usuario.model.js';
import { Op } from 'sequelize';

export const generarPin = async (req, res) => {
  try {
    const { usuario_id } = req.body;

    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario || usuario.rol !== 'administrador') {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    await Pin.create({ codigo: pin, expiracion, usuario_id });

    res.json({ success: true, pin });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: "Error al generar PIN" });
  }
};

export const loginConPin = async (req, res) => {
  try {
    const { pin } = req.body;

    const registro = await Pin.findOne({
      where: {
        codigo: pin,
        expiracion: { [Op.gt]: new Date() }
      },
      include: Usuario
    });

    if (!registro) {
      return res.status(401).json({ success: false, mensaje: "PIN inválido o expirado" });
    }

    res.json({
      success: true,
      usuario: {
        id: registro.Usuario.id,
        nombre_usuario: registro.Usuario.nombre_usuario,
        rol: registro.Usuario.rol,
      },
      token: "PIN_VALIDADO"
    });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: "Error en login por PIN" });
  }
};
