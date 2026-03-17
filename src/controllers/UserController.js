const User = require('../models/User');

class UserController {
  async create(req, res) {
    try {
      const { email, password, confirmPassword, firstname, surname } = req.body;
      // Validação manual: verifica se a senha e a confirmação são iguais antes de salvar
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      // Cria o registro no banco de dados com os dados fornecidos
      const user = await User.create({ email, password, firstname, surname });
      // Retorna apenas ID e E-mail por segurança (evita expor a senha no JSON de retorno)
      return res.status(201).json({ id: user.id, email: user.email });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      // Busca o usuário limitando os campos retornados (attributes) por segurança
      const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'firstname', 'surname', 'email']
      });
      if (!user) return res.status(404).send();
      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).send();
    }
  }

  async update(req, res) {
    try {
      // Localiza o usuário pelo ID da URL
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).send();
      
      // Atualiza os dados permitidos com o que veio no corpo da requisição
      await user.update(req.body);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).send();
    }
  }

  async delete(req, res) {
    try {
      // Busca o usuário para garantir que ele existe antes de deletar
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).send();
      
      // Remove o usuário do banco de dados definitivamente
      await user.destroy();
      return res.status(204).send();
    } catch (error) {
      return res.status(400).send();
    }
  }
}

module.exports = new UserController();