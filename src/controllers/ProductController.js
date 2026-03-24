const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductOption = require('../models/ProductOption');
const { Op } = require('sequelize');

class ProductController {
  async create(req, res) {
    try {
      const { images, options, categoryIds, ...productData } = req.body;
      
      // 1. Cria o produto base
      const product = await Product.create(productData);

      // 2. Salva as imagens (mapeando o campo content)
      if (images && images.length > 0) {
        await Promise.all(images.map(img => 
          ProductImage.create({ content: img.content, productId: product.id })
        ));
      }

      // 3. Salva as opções (convertendo array de values em string)
      if (options && options.length > 0) {
        await Promise.all(options.map(opt => 
          ProductOption.create({ 
            ...opt, 
            values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values,
            productId: product.id 
          })
        ));
      }

      // 4. Associa categorias (Requisito 04 Seção 01)
      if (categoryIds && categoryIds.length > 0) {
        await product.setCategories(categoryIds);
      }

      return res.status(201).json(product);
    } catch (e) {
      console.error("ERRO_CREATE_PRODUCT:", e.message);
      return res.status(400).json({ error: e.message });
    }
  }

  async search(req, res) {
    try {
      // Extrai parâmetros de paginação e o filtro de faixa de preço da URL
      const { limit = 12, page = 1, priceRange } = req.query;
      const where = {};

      // Filtra produtos entre valores mínimo e máximo (ex: 100-500)
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        where.price = { [Op.between]: [min, max] };
      }

      // Busca produtos trazendo junto suas imagens e variações/opções
      const { count, rows } = await Product.findAndCountAll({
        where,
        limit: parseInt(limit) === -1 ? null : parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        include: ['images', 'options']
      });

      return res.status(200).json({ data: rows, total: count });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // Busca um produto específico incluindo TODAS as suas relações
  async getById(req, res) {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: ['images', 'options', 'categories']
      });
      // Retorna o produto ou 404 caso o ID não exista
      return product 
        ? res.json(product) 
        : res.status(404).json({ error: 'Product not found' });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  async update(req, res) {
    try {
      // Localiza o produto e atualiza apenas os dados básicos do corpo da requisição
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      await product.update(req.body);
      return res.status(204).send();
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  async delete(req, res) {
    try {
      // Localiza o produto e o remove (o Sequelize cuidará das associações se houver ON DELETE CASCADE)
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      await product.destroy();
      return res.status(204).send();
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
}

module.exports = new ProductController();