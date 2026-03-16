const { Model, DataTypes } = require('sequelize');

class Category extends Model {
  static init(sequelize) {
    super.init({
      // Requisito 02 da Seção 01: Deve ser name e slug
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      use_in_menu: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
      sequelize,
      tableName: 'categories', 
      underscored: true,
    });
  }
}

module.exports = Category;