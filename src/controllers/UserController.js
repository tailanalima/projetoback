const User = require('../models/User');

class UserController {
  async create(req, res) {
    try {
      const { email, password, confirmPassword, firstname, surname } = req.body;
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      const user = await User.create({ email, password, firstname, surname });
      return res.status(201).json({ id: user.id, email: user.email });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
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
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).send();
      await user.update(req.body);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).send();
    }
  }

  async delete(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).send();
      await user.destroy();
      return res.status(204).send();
    } catch (error) {
      return res.status(400).send();
    }
  }
}

module.exports = new UserController();