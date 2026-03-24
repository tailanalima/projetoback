const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  // Método responsável por realizar o login e gerar o token de acesso
  async generateToken(req, res) {
    try {
      const { email, password } = req.body;
      // Verifica se o usuário existe no banco de dados através do e-mail
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Compara a senha enviada com a senha criptografada no banco
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Define a chave secreta (prioriza o .env, mas tem um fallback para testes)
      const secret = process.env.JWT_SECRET || 'secret_key_geracao_tech';
      
      // Gera o token JWT incluindo o ID do usuário e definindo expiração
      const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
      
      // Retorna o token para o cliente
      return res.status(200).json({ token });
    } catch (error) {
      // Retorna erro interno caso ocorra alguma falha no processo
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();