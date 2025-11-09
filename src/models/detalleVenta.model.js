import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import Producto from "./producto.model.js";

const DetalleVenta = sequelize.define(
  "DetalleVenta",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "productos",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "detalles_venta",
    timestamps: false,
  }
);

// Relación con Producto
DetalleVenta.belongsTo(Producto, { foreignKey: "producto_id", as: "producto" });

export default DetalleVenta;
