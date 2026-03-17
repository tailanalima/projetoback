const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  static init(sequelize) {
    super.init({
      // Nome e sobrenome obrigatórios
      firstname: { type: DataTypes.STRING, allowNull: false },
      surname: { type: DataTypes.STRING, allowNull: false },
      
      // E-mail obrigatório e único (impede dois cadastros com o mesmo e-mail)
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      
      // Senha que será armazenada de forma criptografada (Hash)
      password: { type: DataTypes.STRING, allowNull: false },
    }, {
      sequelize,
      tableName: 'users', 
      hooks: {
        // Verifica se a senha foi alterada ou é nova
        beforeSave: async (user) => {
          if (user.changed('password')) {
            // Transforma a senha em um "Hash" seguro usando 10 níveis de complexidade (salt)
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    });
  }
}

module.exports = User;