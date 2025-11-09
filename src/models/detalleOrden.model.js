import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import Orden from "./ventaProducto.model.js";
import Producto from "./producto.model.js";
import Talla from "./tallas.model.js";

const DetalleOrden = sequelize.define("DetalleOrden", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orden_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "ventaProductos",
      key: "id",
    },
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "productos",
      key: "id",
    },
  },
  talla_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "tallas",
      key: "id",
    },
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  }
}, {
  tableName: "detalles_orden",
  timestamps: false,
});

DetalleOrden.belongsTo(Orden, { foreignKey: "orden_id", as: "ventaProducto" });
DetalleOrden.belongsTo(Producto, { foreignKey: "producto_id", as: "producto" });
DetalleOrden.belongsTo(Talla, { foreignKey: "talla_id", as: "talla" });

export default DetalleOrden;
