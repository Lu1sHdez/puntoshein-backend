// src/models/app/pedido.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../database/database.js";
import Pedido from "./pedido.model.js";

const EstadoPedido = sequelize.define(
  "EstadoPedido",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    estado: {
      type: DataTypes.ENUM("Por hacer", "Parcial","Realizados", "Por entregar", "Entregado"),
      allowNull: false,
      defaultValue: "Por hacer",
    },
    observaciones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "estado_pedidos",
    timestamps: true,
  }
);

Pedido.hasOne(EstadoPedido, { foreignKey: "pedidoId", onDelete: "CASCADE" });
EstadoPedido.belongsTo(Pedido, { foreignKey: "pedidoId" });

export default EstadoPedido;
