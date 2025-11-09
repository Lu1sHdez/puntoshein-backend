import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^\d{10}$/, // Valida que sean exactamente 10 dígitos
    },
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true, // Valida que sea un correo válido
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ultimoCambioPassword:{
    type: DataTypes.DATE,
    allowNull: true
  },
  rol: {
    type: DataTypes.ENUM('usuario', 'administrador', 'empleado'),
    defaultValue: 'usuario',
  },
  genero: {
    type: DataTypes.ENUM('H', 'M'),
    allowNull: true,
  },  
  ubicacion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  tokenRecuperacion:{
    type: DataTypes.STRING,
    allowNull: true,
    // Campos para la recuperación vía SMS:
  },
  smsCodigo: {
    type: DataTypes.STRING,   // o DataTypes.INTEGER, si prefieres
    allowNull: true,
  },
  smsCodigoExpira: {
    type: DataTypes.DATE,     // fecha/hora de expiración del código
    allowNull: true,
  },
  codigoCambioPassword: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  foto_perfil: {
    type: DataTypes.STRING,
  },
  codigoCambioExpira: {
    type: DataTypes.DATE,
    allowNull: true,
  },  
}, {
  tableName: 'usuarios',
  timestamps: true, // Agrega automáticamente los campos createdAt y updatedAt
});

export default Usuario;


