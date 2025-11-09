import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

const Categoria = sequelize.define(
  "Categoria",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Evita duplicados de nombres de categorías
    },
  },
  {
    tableName: "categorias",
    timestamps: false, // No agregamos `createdAt` ni `updatedAt`
  }
);

export default Categoria;
