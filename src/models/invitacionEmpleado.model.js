// models/invitacionEmpleado.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';

const InvitacionEmpleado = sequelize.define('InvitacionEmpleado', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true },
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiracion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'usada', 'expirada'),
    defaultValue: 'pendiente',
  }
}, {
  tableName: 'invitaciones_empleados',
  timestamps: true,
});

export default InvitacionEmpleado;
