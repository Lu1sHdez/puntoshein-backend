import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import Valores from './valores.model.js';  // Importa el modelo de valores

const Empresa = sequelize.define("Empresa", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mision: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  vision: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  historia: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  equipo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "empresa",
  timestamps: false,
});

// Definir la relación con la tabla `valores`
Empresa.hasMany(Valores, { foreignKey: 'empresa_id', as: 'valores' });
Valores.belongsTo(Empresa, { foreignKey: 'empresa_id' });

export default Empresa;
