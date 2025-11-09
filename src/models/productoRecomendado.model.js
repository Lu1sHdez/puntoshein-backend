import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';
import Producto from './producto.model.js';

const ProductoRecomendado = sequelize.define('ProductoRecomendado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  producto_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Producto,
      key: 'id'
    }
  },
  producto_recomendado_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Producto,
      key: 'id'
    }
  },
  confianza: DataTypes.FLOAT,
  lift: DataTypes.FLOAT
}, {
  tableName: 'productos_recomendados',
  timestamps: true,
  updatedAt: false
});

// Relaciones
ProductoRecomendado.belongsTo(Producto, { 
  foreignKey: 'producto_id',
  as: 'producto_principal'
});

ProductoRecomendado.belongsTo(Producto, { 
  foreignKey: 'producto_recomendado_id',
  as: 'producto_recomendado' 
});

export default ProductoRecomendado;