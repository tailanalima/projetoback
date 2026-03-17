const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductImage = require('../models/ProductImage');
const ProductOption = require('../models/ProductOption');
const { Op, Sequelize } = require('sequelize');

//Service responsável pela lógica de negócio de Produtos.
class ProductService {
  
   //Realiza uma busca complexa por produtos com base em query params.
   
  async search(query) {
   // Destruturação com valores default para paginação
    const { limit = 12, page = 1, fields, match, category_ids, 'price-range': priceRange } = query;
    
    // Configuração base da consulta Sequelize
    // distinct: true é vital para contar corretamente registros em JOINS 1:N
    const findOptions = { where: {}, include: [], distinct: true }; // Adicionado distinct para evitar duplicatas

    // Lógica de Paginação (Ignorada se limit for -1)
    if (limit !== '-1') {
        findOptions.limit = parseInt(limit);
        findOptions.offset = (parseInt(page) - 1) * parseInt(limit);
    }

    // Filtro de Busca Textual (Nome ou Descrição) usando LIKE
    if (match) {
        findOptions.where[Op.or] = [
            { nome: { [Op.like]: `%${match}%` } },
            { description: { [Op.like]: `%${match}%` } },
        ];
    }
    
    // Filtro por Categorias (Relacionamento Many-to-Many)
    if (category_ids) {
        findOptions.include.push({
            model: Category, as: 'categories',
            where: { id: { [Op.in]: category_ids.split(',') } },
            attributes: [], through: { attributes: [] }
        });
    }

    // Filtro por Faixa de Preço
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        findOptions.where.preco = { [Op.between]: [min, max] };
    }
    
    // Filtros Dinâmicos de Opções (ex: option[1]=azul,vermelho)
    for (const key in query) {
        if (key.startsWith('option[')) {
            const optionId = key.match(/\[(\d+)\]/)[1];
            const optionValues = query[key].split(',');
            findOptions.include.push({
                model: ProductOption, as: 'options',
                where: {
                    id: optionId,
                    // Uso de JSON_CONTAINS para verificar valores dentro de uma coluna JSON no MySQL
                    valores_do_produto: {
                        [Op.and]: optionValues.map(val => Sequelize.where(
                            Sequelize.fn('JSON_CONTAINS', Sequelize.col('valores_do_produto'), `"${val}"`), 1
                        ))
                    }
                },
            });
        }
    }

    // Includes padrão para garantir que imagens, opções e categorias venham no retorno
    findOptions.include.push(
        { model: ProductImage, as: 'images', attributes: ['id', 'path'] },
        { model: ProductOption, as: 'options' },
        { model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } }
    );

    // Seleção de campos específicos (SQL Select)
    if (fields) findOptions.attributes = fields.split(',');
    
    // Executa a busca e conta o total de registros
    const { count, rows } = await Product.findAndCountAll(findOptions);

    // Formatação dos dados para o padrão da API (Data Mapping)
    const data = rows.map(product => {
        const plainProduct = product.get({ plain: true });
        return {
            ...plainProduct,
            category_ids: plainProduct.categories.map(cat => cat.id),
            images: plainProduct.images.map(img => ({ id: img.id, content: img.path }))
        };
    });

    return { data, total: count, limit: limit === '-1' ? count : parseInt(limit), page: limit === '-1' ? 1 : parseInt(page) };
  }

  /**
   * Busca um produto específico por ID com todas as suas associações.
   */
  async findById(id) {
    const product = await Product.findByPk(id, {
        include: [
            { model: ProductImage, as: 'images' },
            { model: ProductOption, as: 'options' },
            { model: Category, as: 'categories', through: { attributes: [] } }
        ]
    });

    if(!product) return null;

    // Normalização do objeto de retorno
    const plainProduct = product.get({ plain: true });
    return {
        ...plainProduct,
        category_ids: plainProduct.categories.map(cat => cat.id),
        images: plainProduct.images.map(img => ({ id: img.id, content: img.path }))
    };
  }

 /**
   * Cria um produto. Usa transação para garantir que se a imagem ou opção falhar, 
   * o produto não seja criado (Atomicidade).
   */
  async create(data) {
    const { category_ids, images, options, ...productData } = data;
    const transaction = await Product.sequelize.transaction();
    try {
        const product = await Product.create(productData, { transaction });

        // Vincula categorias (Tabela N:N)
        if (category_ids && category_ids.length > 0) {
            await product.setCategories(category_ids, { transaction });
        }
        // Cria registros de imagens
        if (images && Array.isArray(images)) {
            const imagePromises = images.map(img => ProductImage.create({
                product_id: product.id,
                path: `path/to/${product.slug}-${Date.now()}.${img.type.split('/')[1]}`
            }, { transaction }));
            await Promise.all(imagePromises);
        }
        // Cria opções/variações do produto
        if (options && Array.isArray(options)) {
            const optionPromises = options.map(opt => {
                const valores = opt.value || opt.values;
                return ProductOption.create({
                    product_id: product.id,
                    titulo: opt.title,
                    shape: opt.shape,
                    radius: opt.radius,
                    type: opt.type,
                    valores_do_produto: valores
                }, { transaction });
            });
            await Promise.all(optionPromises);
        }
        await transaction.commit();
        return product;
    } catch (error) {
        await transaction.rollback();
        console.error('Falha na criação do produto:', error);
        throw error;
    }
  }

  /**
   * Atualiza produto, imagens e opções.
   * Lógica complexa que decide entre criar, atualizar ou deletar associações.
   */
  async update(id, data) {
    const { category_ids, images, options, ...productData } = data;
    const transaction = await Product.sequelize.transaction();
    
    try {
        const product = await Product.findByPk(id, { transaction });
        if (!product) {
            await transaction.rollback();
            return false;
        }

        // Atualiza os dados básicos do produto
        await product.update(productData, { transaction });

        // Atualiza Categorias (Sobrescreve as antigas)
        if (category_ids) {
            await product.setCategories(category_ids, { transaction });
        }

        // Sincronização de Imagens (Delete ou Create)
        if (images && Array.isArray(images)) {
            for (const image of images) {
                if (image.id && image.deleted) {
                    await ProductImage.destroy({ where: { id: image.id, product_id: product.id }, transaction });
                } else if (!image.id && image.content) {
                    await ProductImage.create({
                        product_id: product.id,
                        path: `path/to/${product.slug}-${Date.now()}.${image.type.split('/')[1]}`
                    }, { transaction });
                }
            }
        }

        // Sincronização de Opções (Delete, Update ou Create)
        if (options && Array.isArray(options)) {
            for (const option of options) {
                if (option.id && option.deleted) {
                    await ProductOption.destroy({ where: { id: option.id, product_id: product.id }, transaction });
                } else if (option.id) {
                    // Prepara os dados de atualização, ignorando o ID para não tentar atualizar a chave primária
                    const updateData = { ...option };
                    delete updateData.id;
                    await ProductOption.update(updateData, { where: { id: option.id, product_id: product.id }, transaction });
                } else if (!option.id && option.title) {
                    await ProductOption.create({
                        product_id: product.id,
                        titulo: option.title,
                        shape: option.shape,
                        radius: option.radius,
                        type: option.type,
                        valores_do_produto: option.value || option.values
                    }, { transaction });
                }
            }
        }
        
        await transaction.commit();
        return true;

    } catch (error) {
        await transaction.rollback();
        console.error('Falha na atualização do produto:', error);
        throw error;
    }
  }

  /**
   * Remove o produto do banco de dados.
   * Nota: Se houver ON DELETE CASCADE no DB, as imagens/opções somem automaticamente.
   */
  async delete(id) {
    const result = await Product.destroy({ where: { id } });
    return result > 0;
  }
}

// Exporta uma instância única (Singleton) para ser reutilizada na aplicação.
module.exports = new ProductService();