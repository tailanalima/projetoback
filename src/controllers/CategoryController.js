const Category = require('../models/Category');

class CategoryController {
  
  // Requisito: GET /v1/categoria/pesquisa
  // Retorna uma lista paginada de categorias, com opções de filtro.
  async search(req, res) {
    try {
      let { limit = 12, page = 1, fields, use_in_menu } = req.query;

      // Tratamento para o limit -1 (buscar todos)
      limit = parseInt(limit);
      page = parseInt(page);
      
      const queryLimit = limit === -1 ? null : limit;
      const queryOffset = limit === -1 ? null : (page - 1) * limit;

      // Montagem do filtro (Where)
      const where = {};
      if (use_in_menu !== undefined) {
        where.use_in_menu = use_in_menu === 'true' || use_in_menu === true;
      }

      // Limitar campos retornados (Fields)
      const attributes = fields 
        ? fields.split(',') 
        : ['id', 'nome', 'slug', 'use_in_menu'];

      // Consulta ao banco com contagem total
      const { count, rows } = await Category.findAndCountAll({
        where,
        attributes,
        limit: queryLimit,
        offset: queryOffset,
      });

      // Retorno 200 OK com corpo da mensagem
      return res.status(200).json({
        data: rows,
        total: count,
        limit: limit,
        page: limit === -1 ? 1 : page
      });

    } catch (error) {
      // Retorno 400 Bad Request em caso de erro do cliente/servidor na busca
      return res.status(400).json({ error: 'Falha na busca.' });
    }
  }

  // Requisito: GET /v1/categoria/:id
  // Busca uma categoria específica pelo seu ID.
  async getById(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);

      if (!category) {
        // Retorno 404 Not Found se a categoria não existir
        return res.status(404).json({ error: 'Categoria não encontrada.' });
      }

      // Retorno 200 OK com os dados
      return res.status(200).json(category);
    } catch (error) {
      return res.status(400).json({ error: 'Falha ao buscar categoria.' });
    }
  }

  // Requisito: POST /v1/categoria
  // Cria uma nova categoria. Requer autenticação.
  async create(req, res) {
    try {
      const { nome, slug, use_in_menu } = req.body;

      // Verifica se o slug já existe para evitar erro de duplicidade (OPCIONAL se o DB já valida)
      const existingCategory = await Category.findOne({ where: { slug } });
      if (existingCategory) {
        return res.status(400).json({ error: 'Dados inválidos (slug já existe).' });
      }

      const category = await Category.create({ 
        nome, 
        slug, 
        use_in_menu: use_in_menu || false 
      });

      // Retorno 201 Created quando o cadastro for bem sucedido
      return res.status(201).json(category);
    } catch (error) {
      return res.status(400).json({ error: 'Falha ao criar categoria.' });
    }
  }

  // Requisito: PUT /v1/categoria/:id
  // Atualiza uma categoria existente. Requer autenticação.
  async update(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada.' });
      }

      const { nome, slug, use_in_menu } = req.body;
      await category.update({ nome, slug, use_in_menu });

      // Retorno 204 No Content para atualizações bem sucedidas
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: 'Falha ao atualizar categoria.' });
    }
  }

  // Requisito: DELETE /v1/categoria/:id
  // Deleta uma categoria. Requer autenticação.
  async delete(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada.' });
      }

      await category.destroy();

      // Retorno 204 No Content para deleção bem sucedida
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: 'Falha ao deletar categoria.' });
    }
  }
}

module.exports = new CategoryController();