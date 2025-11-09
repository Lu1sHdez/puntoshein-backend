import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import Producto from "./producto.model.js";
import Usuario from "./usuario.model.js";
import Talla from "./tallas.model.js"; // 👈 Importa el modelo de Talla

const Venta = sequelize.define("Venta", {
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
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "usuarios",
      key: "id",
    },
  },
  talla_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser null si el producto no tiene tallas
    references: {
      model: "tallas",
      key: "id",
    },
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_venta: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "ventas",
  timestamps: false,
});

// Relaciones
Venta.belongsTo(Producto, { foreignKey: "producto_id", as: "producto" });
Venta.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
Venta.belongsTo(Talla, { foreignKey: "talla_id", as: "talla" }); // 👈 Relación con la talla

export default Venta;
