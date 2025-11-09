import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

const TokenDispositivo = sequelize.define("TokenDispositivo", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: "token_dispositivo",
  timestamps: false,
});

export default TokenDispositivo;
