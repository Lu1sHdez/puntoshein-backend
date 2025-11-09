import TokenDispositivo from "../models/tokenDispositivo.model.js";

export const registrarToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ mensaje: "Token requerido" });
    }

    // Evitar duplicados
    const [registro, creado] = await TokenDispositivo.findOrCreate({
      where: { token },
    });

    res.json({ mensaje: creado ? "Token registrado" : "Token ya existía" });
  } catch (error) {
    console.error("Error al registrar token:", error);
    res.status(500).json({ mensaje: "Error al registrar token" });
  }
};
