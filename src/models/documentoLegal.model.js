import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';

const DocumentoLegal = sequelize.define('DocumentoLegal', {
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  contenido: {
    type: DataTypes.JSON, // Guarda objetos o arrays como JSON real
    allowNull: false,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false, // No usa createdAt / updatedAt automáticos
  tableName: 'documentos_legales',
});

export default DocumentoLegal;
