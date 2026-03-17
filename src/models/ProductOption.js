const { Model, DataTypes } = require('sequelize');

class ProductOption extends Model {
  static init(sequelize) {
    super.init({
      // Título da opção
      title: { type: DataTypes.STRING, allowNull: false },
      
      // Formato visual da opção no Front-end: só aceita 'square' (quadrado) ou 'circle' (círculo)
      shape: { type: DataTypes.ENUM('square', 'circle'), defaultValue: 'square' },
      
      // Define o arredondamento da borda (raio) se necessário
      radius: { type: DataTypes.INTEGER, defaultValue: 0 },
      
      // Define se a variação é exibida como texto ou como uma cor 
      type: { type: DataTypes.ENUM('text', 'color'), defaultValue: 'text' },
      
      // Valores das opções salvos como String
      values: { type: DataTypes.STRING, allowNull: false }, 
    }, {
      sequelize,
      tableName: 'product_options',
      underscored: true,
    });
  }

  static associate(models) {
    // Define que esta opção pertence a um produto específico (N:1)
    this.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  }
}

module.exports = ProductOption;