const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductOption = require('../models/ProductOption');
const { Op } = require('sequelize');
const { sequelize } = require('../models/User'); // Instância para transações

class ProductController {
  
  // GET /v1/produto/pesquisa
  async search(req, res) {
    try {
      let { limit = 12, page = 1, 'price-range': priceRange } = req.query;
      const where = {};
      
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        where.price = { [Op.between]: [min, max] };
      }

      const { count, rows } = await Product.findAndCountAll({
        where,
        limit: limit === '-1' ? null : parseInt(limit),
        offset: limit === '-1' ? null : (parseInt(page) - 1) * parseInt(limit),
        include: [
          { model: ProductImage, as: 'images' },
          { model: ProductOption, as: 'options' }
        ],
        distinct: true
      });
      return res.status(200).json({ data: rows, total: count });
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // POST /v1/produto
  async create(req, res) {
    const t = await sequelize.transaction();
    try {
      const { category_ids, images, options, ...data } = req.body;
      
      // Mapeia os campos para o padrão em inglês do Model
      const productPayload = {
        enabled: data.enabled,
        name: data.name || data.nome,
        slug: data.slug,
        stock: data.stock,
        description: data.description,
        price: data.price || data.preco,
        price_with_discount: data.price_with_discount
      };

      const product = await Product.create(productPayload, { transaction: t });

      if (category_ids) await product.setCategories(category_ids, { transaction: t });

      if (images) {
        await ProductImage.bulkCreate(
          images.map(img => ({ product_id: product.id, path: img.content || img.path })), 
          { transaction: t }
        );
      }

      if (options) {
        await ProductOption.bulkCreate(
          options.map(opt => ({ 
            product_id: product.id, 
            title: opt.title,
            shape: opt.shape,
            type: opt.type,
            values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values 
          })), 
          { transaction: t }
        );
      }

      await t.commit();
      return res.status(201).json(product);
    } catch (e) {
      await t.rollback();
      console.error("ERRO NO CREATE:", e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // GET /v1/produto/:id
  async getById(req, res) {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: [
          { model: ProductImage, as: 'images' }, 
          { model: ProductOption, as: 'options' }
        ]
      });
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
      return res.status(200).json(product);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }

  // PUT /v1/produto/:id (ESTA ERA A FUNÇÃO QUE FALTAVA!)
  async update(req, res) {
    const t = await sequelize.transaction();
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

      const { category_ids, ...data } = req.body;
      
      const updateData = {
        name: data.name || data.nome,
        price: data.price || data.preco,
        ...data
      };

      await product.update(updateData, { transaction: t });

      if (category_ids) {
        await product.setCategories(category_ids, { transaction: t });
      }

      await t.commit();
      return res.status(204).send();
    } catch (e) {
      await t.rollback();
      return res.status(400).json({ error: e.message });
    }
  }

  // DELETE /v1/produto/:id
  async delete(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
      await product.destroy();
      return res.status(204).send();
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
}

module.exports = new ProductController();