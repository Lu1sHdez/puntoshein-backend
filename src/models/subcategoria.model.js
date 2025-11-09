import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import Categoria from "./categoria.model.js";

const Subcategoria = sequelize.define("Subcategoria", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "categorias",
      key: "id",  
    },
    onDelete: "CASCADE",
  },
}, {
  tableName: "subcategorias",
  timestamps: false,
});

// Definir la relación con Categoria
Subcategoria.belongsTo(Categoria, { foreignKey: "categoria_id", as: "categoria" });

export default Subcategoria;
