import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';

const PreguntaFrecuente = sequelize.define('PreguntaFrecuente', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pregunta: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  respuesta: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'preguntas_frecuentes',
  timestamps: true, // Agrega automáticamente los campos createdAt y updatedAt
});

export default PreguntaFrecuente;
