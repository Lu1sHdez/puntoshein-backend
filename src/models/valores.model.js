import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

const Valores = sequelize.define("Valores", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'empresa',
      key: 'id',
    },
    onDelete: 'CASCADE',
  }
}, {
  tableName: 'valores',
  timestamps: false,
});

export default Valores;
