// src/models/app/pedido.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../database/database.js";
import Cliente from "./cliente.model.js";

const Pedido = sequelize.define(
  "Pedido",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    anticipo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    restante: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    metodoPago: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "pedidos",
    timestamps: true,
  }
);

// 🔗 Relaciones
Cliente.hasMany(Pedido, { foreignKey: "clienteId", onDelete: "CASCADE" });
Pedido.belongsTo(Cliente, { foreignKey: "clienteId" });

export default Pedido;
