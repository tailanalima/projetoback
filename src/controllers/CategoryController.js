const Category = require('../models/Category');

class CategoryController {
  // GET /v1/category/search
  
async search(req, res) {
  try {
    // Definimos valores padrão caso o teste não envie nada
    const limit = req.query.limit ? parseInt(req.query.limit) : 12;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    
    const queryLimit = limit === -1 ? null : limit;
    const queryOffset = limit === -1 ? 0 : (page - 1) * limit;

    const { count, rows } = await Category.findAndCountAll({
      limit: queryLimit,
      offset: queryOffset,
      order: [['name', 'ASC']], // Ordenando pelo campo 'name' em inglês
    });

    return res.status(200).json({
      data: rows,
      total: count,
      limit,
      page,
    });
  } catch (e) {
    // Se der erro, o console vai te mostrar a mensagem real agora!
    console.error("ERRO_BUSCA:", e.message);
    return res.status(400).json({ error: e.message });
  }
}
  // POST /v1/category
  async create(req, res) {
    try {
      const { name, slug, use_in_menu } = req.body;
      const category = await Category.create({ name, slug, use_in_menu });
      return res.status(201).json(category);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // GET /v1/category/:id
  async getById(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).send();
      return res.status(200).json(category);
    } catch (e) {
      return res.status(400).send();
    }
  }

  // PUT /v1/category/:id
  async update(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).send();
      
      const { name, slug, use_in_menu } = req.body;
      await category.update({ name, slug, use_in_menu });
      
      return res.status(204).send();
    } catch (e) {
      return res.status(400).send();
    }
  }

  // DELETE /v1/category/:id
  async delete(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).send();
      await category.destroy();
      return res.status(204).send();
    } catch (e) {
      return res.status(400).send();
    }
  }
}

module.exports = new CategoryController();