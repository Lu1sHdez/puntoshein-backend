// src/utils/registrarEventoCritico.js
import logger from '../libs/logger.js';
import obtenerFechaHora from './funciones.js'; // o de donde lo tengas

const registrarEventoCritico = ({ mensaje, codigo_error = "CRITICO", extra = {} }) => {
  logger.critical(mensaje, {
    codigo_error,
    fecha_hora: obtenerFechaHora(),
    ...extra
  });
};

export default registrarEventoCritico;
