const { Model, DataTypes } = require('sequelize');

class ProductImage extends Model {
  static init(sequelize) {
    super.init({
     // Conteúdo da imagem: definido como TEXT para suportar strings longas (como Base64) 
      content: { type: DataTypes.TEXT, allowNull: false }, 
    }, {
      sequelize,
      tableName: 'product_images',
      underscored: true,
    });
  }

  static associate(models) {
    // Define que cada imagem pertence a um único produto (N:1)
    // A chave estrangeira 'product_id' liga esta imagem ao seu respectivo produto
    this.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  }
}

module.exports = ProductImage;