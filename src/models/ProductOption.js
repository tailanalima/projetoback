const { Model, DataTypes } = require('sequelize');

class ProductOption extends Model {
  static init(sequelize) {
    super.init({
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false }, // Era titulo
      shape: { 
        type: DataTypes.ENUM('square', 'circle'), // Use os nomes em inglês
        defaultValue: 'square' 
      },
      radius: { type: DataTypes.INTEGER, defaultValue: 0 },
      type: { 
        type: DataTypes.ENUM('text', 'color'), // Use os nomes em inglês
        defaultValue: 'text' 
      },
      values: { type: DataTypes.STRING, allowNull: false }, // Era valores_do_produto
    }, {
      sequelize,
      tableName: 'product_options',
      timestamps: false
    });
  }

  static associate(models) {
    this.belongsTo(models.Product, { foreignKey: 'product_id' });
  }
}

module.exports = ProductOption;