import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

const Talla = sequelize.define("Talla", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: "tallas",
  timestamps: false,
});

export default Talla;
