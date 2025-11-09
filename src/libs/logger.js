//src\libs\logger.js
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { obtenerFechaHora } from '../utils/funciones.js';
//Creación del directorio de logs
const logDir = 'src/logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

//Niveles y colores personalizados
const customLevels = {
  levels: { critical: 0, error: 1, warn: 2, info: 3, debug: 4 },
  colors: { 
    critical: 'red bold', 
    error: 'red', 
    warn: 'yellow', 
    info: 'blue', 
    debug: 'gray' 
  }
};
winston.addColors(customLevels.colors);

//Formato de los mensajes
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: () => obtenerFechaHora() 
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    if (typeof message === 'object') {
      return `[${timestamp}] ${level.toUpperCase()}: ${JSON.stringify(message)}`;
    }
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
  })
);

// Archivo diario único (se mantiene igual)
const dailyLogFile = () => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, `app-${date}.log`);
};
//Creación del logger
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: dailyLogFile(),
      level: 'debug',
    }),
  ],
});

export default logger;