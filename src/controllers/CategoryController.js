const Category = require('../models/Category');

class CategoryController {
  // GET /category/search
 
  // Lista categorias com suporte a paginação e ordenação 
  async search(req, res) {
    try {
      // Define paginação: padrão 12 itens por página, começando na página 1
      const limit = req.query.limit ? parseInt(req.query.limit) : 12;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      
      // Se limit for -1, desabilita o limite (traz todos os registros)
      const queryLimit = limit === -1 ? null : limit;
      const queryOffset = limit === -1 ? 0 : (page - 1) * limit;

      // Busca no banco contando o total e trazendo os registros da página
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
      // Se der erro, o console vai mostrar
      console.error("ERRO_BUSCA:", e.message);
      return res.status(400).json({ error: e.message });
    }
  }

  // POST /category
  // Cria uma nova categoria
  async create(req, res) {
    try {
      const { name, slug, useInMenu, } = req.body;
      const category = await Category.create({ name, slug, useInMenu });
      return res.status(201).json(category);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // GET /category/:id
  // Busca uma única categoria pelo ID (Primary Key)
  async getById(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });
      return res.status(200).json(category);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // PUT /category/:id
  // Atualiza os dados de uma categoria existente
  async update(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });
      
      const { name, slug, useInMenu } = req.body;
      await category.update({ name, slug, useInMenu });
      
      return res.status(204).send();
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // DELETE /category/:id
  // Remove uma categoria do banco de dados
  async delete(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Category not found' });
      await category.destroy();
      return res.status(204).send();
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
}

module.exports = new CategoryController();