import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

const Prediccion = sequelize.define("Prediccion", {
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true, 
  },
  producto_nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  semana_prediccion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  fecha_prediccion: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, // 👈 la combinación hará que no busque id
  },
  demanda_predicha: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  fecha_generacion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: "predicciones_demanda",
  timestamps: false,
  freezeTableName: true,
  // 👇 Esta es la clave: Sequelize no intente buscar columna "id"
  createdAt: false,
  updatedAt: false,
  hasPrimaryKeys: true, // aunque es opcional con la combinación anterior
});


export default Prediccion;
