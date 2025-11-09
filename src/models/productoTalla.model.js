import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import Producto from "./producto.model.js";
import Talla from "./tallas.model.js";

const ProductoTalla = sequelize.define("ProductoTalla", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: "producto_tallas",
  timestamps: false,
});

// Relaciones Many-to-Many
Producto.belongsToMany(Talla, {
  through: ProductoTalla,
  foreignKey: "producto_id",
  otherKey: "talla_id",
  as: "tallas",
});

Talla.belongsToMany(Producto, {
  through: ProductoTalla,
  foreignKey: "talla_id",
  otherKey: "producto_id",
  as: "productos",
});

export default ProductoTalla;
