// src/models/app/cliente.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../database/database.js";

const Cliente = sequelize.define(
  "Cliente",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido_paterno: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido_materno: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^\d{10}$/,
      },
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: {
          msg: "El formato del correo no es válido.",
        },
      },
      set(value) {
        this.setDataValue("correo", value && value.trim() !== "" ? value : null);
      },
    },    
    direccion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    genero: {
      type: DataTypes.ENUM("H", "M", "Otro"),
      allowNull: true,
    },
  },
  {
    tableName: "clientes",
    timestamps: true,
  }
);

export default Cliente;
