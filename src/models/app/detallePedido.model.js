// src/models/app/detallePedido.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../database/database.js";
import Pedido from "./pedido.model.js";

// src/models/app/detallePedido.model.js
const DetallePedido = sequelize.define(
  "DetallePedido",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre_producto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    incluyeTalla: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    talla: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    costo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    completado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    tableName: "detalle_pedidos",
    timestamps: true,
  }
);


Pedido.hasMany(DetallePedido, { foreignKey: "pedidoId", onDelete: "CASCADE" });
DetallePedido.belongsTo(Pedido, { foreignKey: "pedidoId" });

export default DetallePedido;
