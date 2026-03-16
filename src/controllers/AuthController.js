const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  async generateToken(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Se o .env não carregar no Jest, ele usa a chave padrão
      const secret = process.env.JWT_SECRET || 'secret_key_geracao_tech';
      const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
      
      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();