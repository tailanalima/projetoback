const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const ProductOption = require('../models/ProductOption');
const { Op } = require('sequelize');

class ProductController {
  async create(req, res) {
    try {
      const { images, options, category_ids, ...productData } = req.body;
      
      // 1. Cria o produto base
      const product = await Product.create(productData);

      // 2. Salva as imagens (mapeando o campo content)
      if (images && images.length > 0) {
        await Promise.all(images.map(img => 
          ProductImage.create({ content: img.content, product_id: product.id })
        ));
      }

      // 3. Salva as opções (convertendo array de values em string)
      if (options && options.length > 0) {
        await Promise.all(options.map(opt => 
          ProductOption.create({ 
            ...opt, 
            values: Array.isArray(opt.values) ? opt.values.join(',') : opt.values,
            product_id: product.id 
          })
        ));
      }

      // 4. Associa categorias (Requisito 04 Seção 01)
      if (category_ids && category_ids.length > 0) {
        await product.setCategories(category_ids);
      }

      return res.status(201).json(product);
    } catch (e) {
      console.error("ERRO_CREATE_PRODUCT:", e.message);
      return res.status(400).json({ error: e.message });
    }
  }

  async search(req, res) {
    try {
      const { limit = 12, page = 1, 'price-range': priceRange } = req.query;
      const where = {};

      // Lógica do price-range (Ex: 400-700)
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        where.price = { [Op.between]: [min, max] };
      }

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
  async getById(req, res) {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: ['images', 'options', 'categories']
      });
      return product ? res.json(product) : res.status(404).send();
    } catch (e) {
      return res.status(400).send();
    }
  }

  async update(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).send();
      await product.update(req.body);
      return res.status(204).send();
    } catch (e) {
      return res.status(400).send();
    }
  }

  async delete(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).send();
      await product.destroy();
      return res.status(204).send();
    } catch (e) {
      return res.status(400).send();
    }
  }
}

module.exports = new ProductController();