const { Model, DataTypes } = require('sequelize');

class Product extends Model {
  static init(sequelize) {
    super.init({
      
      // Nome e slug (URL amigável) obrigatórios para o produto
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      
      // Descrição longa usando TEXT (aceita mais caracteres que STRING)
      description: DataTypes.TEXT,
      
      // Preço com 10 dígitos no total e 2 após a vírgula (Ex: 99999999.99)
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      
      // Campo opcional para armazenar o valor promocional
      price_with_discount: DataTypes.DECIMAL(10, 2),
      
      // Quantidade em estoque, começa em 0 se não for informado
      stock: { type: DataTypes.INTEGER, defaultValue: 0 },
      
      // Define se o produto está ativo/visível na loja (padrão ativo)
      enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
      sequelize,
      tableName: 'products',
      underscored: true,
    });
  }

  static associate(models) {
    // Define que um produto possui várias imagens (1:N)
    this.hasMany(models.ProductImage, { foreignKey: 'product_id', as: 'images' });
    
    // Define que um produto possui várias opções/variações (1:N)
    this.hasMany(models.ProductOption, { foreignKey: 'product_id', as: 'options' });
    
    // Usa uma tabela intermediária chamada 'product_categories' para ligar os dois
    this.belongsToMany(models.Category, { 
      through: 'product_categories', 
      foreignKey: 'product_id', 
      as: 'categories' 
    });
  }
}

module.exports = Product;