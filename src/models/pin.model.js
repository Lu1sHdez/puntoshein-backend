// models/pin.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import Usuario from './usuario.model.js';

const Pin = sequelize.define('Pin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  codigo: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
  },
  expiracion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.UUID,
    references: {
      model: Usuario,
      key: 'id',
    }
  }
}, {
  tableName: 'pins',
  timestamps: true,
});

Pin.belongsTo(Usuario, { foreignKey: 'usuario_id' });

export default Pin;
