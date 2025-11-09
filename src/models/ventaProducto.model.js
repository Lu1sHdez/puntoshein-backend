import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import Usuario from "./usuario.model.js";

const VentaProducto = sequelize.define("VentaProducto", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "usuarios",
      key: "id",
    },
  },
  fecha_venta: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "ventaProductos", // 👈 tabla final
  timestamps: false,
});

VentaProducto.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });

export default VentaProducto;
