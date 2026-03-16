const { Model, DataTypes } = require('sequelize');

class Product extends Model {
  static init(sequelize) {
    super.init({
      enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      name: { type: DataTypes.STRING, allowNull: false }, // Era nome
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      stock: { type: DataTypes.INTEGER, defaultValue: 0 },
      description: { type: DataTypes.TEXT },
      price: { type: DataTypes.FLOAT, allowNull: false }, // Era preco
      price_with_discount: { type: DataTypes.FLOAT, allowNull: false },
    }, {
      sequelize,
      tableName: 'products', // Padrão PDF
    });
  }

  static associate(models) {
    this.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'images' });
    this.hasMany(models.ProductOption, { foreignKey: 'product_id', as: 'options' });
    this.belongsToMany(models.Category, { 
      through: 'product_category', 
      foreignKey: 'product_id', 
      as: 'categories' 
    });
  }
}

module.exports = Product;