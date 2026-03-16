const { Model, DataTypes } = require('sequelize');

class Product extends Model {
  static init(sequelize) {
    super.init({
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.TEXT,
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      price_with_discount: DataTypes.DECIMAL(10, 2),
      stock: { type: DataTypes.INTEGER, defaultValue: 0 },
      enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
      sequelize,
      tableName: 'products',
      underscored: true,
    });
  }

  static associate(models) {
    // Um produto tem muitas imagens e muitas opções
    this.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'images' });
    this.hasMany(models.ProductOption, { foreignKey: 'product_id', as: 'options' });
    
    // Relação com Categorias (Tabela intermediária)
    this.belongsToMany(models.Category, { 
      through: 'product_categories', 
      foreignKey: 'product_id', 
      as: 'categories' 
    });
  }
}

module.exports = Product;