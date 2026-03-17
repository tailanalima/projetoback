const { Model, DataTypes } = require('sequelize');

class Category extends Model {
  // O método static init inicializa o modelo para o Sequelize
  static init(sequelize) {
    super.init({
      // Define a coluna 'name' como String e obrigatória (não aceita nulo)
      name: { type: DataTypes.STRING, allowNull: false },
      
      // Define a coluna 'slug' (usada para URLs amigáveis) como String e obrigatória
      slug: { type: DataTypes.STRING, allowNull: false },
      
      // Define se a categoria aparece no menu. Se não for enviado, o padrão é 'false'
      use_in_menu: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
      sequelize,
      tableName: 'categories', 
      underscored: true,
    });
  }
}

module.exports = Category;