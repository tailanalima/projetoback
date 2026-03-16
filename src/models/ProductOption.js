const { Model, DataTypes } = require('sequelize');

class ProductOption extends Model {
  static init(sequelize) {
    super.init({
      title: { type: DataTypes.STRING, allowNull: false },
      shape: { type: DataTypes.ENUM('square', 'circle'), defaultValue: 'square' },
      radius: { type: DataTypes.INTEGER, defaultValue: 0 },
      type: { type: DataTypes.ENUM('text', 'color'), defaultValue: 'text' },
      values: { type: DataTypes.STRING, allowNull: false }, // Salvaremos como string separada por vírgula
    }, {
      sequelize,
      tableName: 'product_options',
      underscored: true,
    });
  }

  static associate(models) {
    this.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  }
}

module.exports = ProductOption;