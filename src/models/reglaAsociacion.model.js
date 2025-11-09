import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import Producto from './producto.model.js';

const ReglaAsociacion = sequelize.define('ReglaAsociacion', { // 👈 nombre del modelo en minúsculas
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  antecedente: { type: DataTypes.STRING, allowNull: false },
  consecuente: { type: DataTypes.STRING, allowNull: false },
  soporte: { type: DataTypes.FLOAT, allowNull: false },
  confianza: { type: DataTypes.FLOAT, allowNull: false },
  lift: { type: DataTypes.FLOAT, allowNull: false },
  producto_consecuente_id: {
    type: DataTypes.INTEGER,
    references: { model: 'productos', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  }
}, {
  tableName: 'reglas_asociacion',         // 👈 debe coincidir con tu tabla real en PostgreSQL
  timestamps: false
});

// Asociación explícita
ReglaAsociacion.belongsTo(Producto, {
  foreignKey: 'producto_consecuente_id',
  as: 'productoConsecuente'
});

export default ReglaAsociacion;
