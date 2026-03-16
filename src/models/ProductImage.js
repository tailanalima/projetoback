const { Model, DataTypes } = require('sequelize');

class ProductImage extends Model {
  static init(sequelize) {
    super.init({
      // Mudamos para 'content' para bater com o seu teste
      content: { type: DataTypes.TEXT, allowNull: false }, 
    }, {
      sequelize,
      tableName: 'product_images',
      underscored: true,
    });
  }

  static associate(models) {
    this.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  }
}

module.exports = ProductImage;