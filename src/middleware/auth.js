import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ mensaje: "No autorizado, token no encontrado." });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    req.userId = decoded.id;
    req.userRol = decoded.rol;
    next();
  } catch (error) {
    // Si el token ha expirado, manejar el error
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: "Token expirado, por favor inicie sesión nuevamente." });
    }
    return res.status(401).json({ mensaje: "Token no válido." });
  }
};

export const validarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ mensaje: "No autorizado, token no encontrado." });
    }
    try {
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
      if (!rolesPermitidos.includes(decoded.rol)) {
        return res.status(403).json({ mensaje: "Acceso denegado, no tienes permisos para esta acción." });
      }
      req.userId = decoded.id;
      req.userRol = decoded.rol;
      next();
    } catch (error) {
      return res.status(401).json({ mensaje: "Token no válido." });
    }
  };
};
