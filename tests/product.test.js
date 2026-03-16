const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/User'); 

// CONFIGURAÇÃO DE AMBIENTE
process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';

jest.setTimeout(30000); 

let token;
let categoryId;
let productId;

beforeAll(async () => {
  // Limpa o banco antes de começar
  await sequelize.sync({ force: true });
  
  // 1. Cria usuário Admin
  await request(app).post('/v1/usuario').send({
      firstname: 'Admin', 
      surname: 'Produtos', 
      email: 'admin.prod@example.com',
      password: 'password123', 
      confirmPassword: 'password123',
  });

  // 2. Login
  const tokenRes = await request(app).post('/v1/usuario/login').send({
      email: 'admin.prod@example.com', 
      password: 'password123',
  });
  token = tokenRes.body.token;

  // 3. Cria categoria
  const catRes = await request(app)
    .post('/v1/categoria')
    .set('Authorization', `Bearer ${token}`)
    .send({ 
        nome: 'Calçados', 
        slug: 'calcados', 
        use_in_menu: true 
    });
  
  categoryId = catRes.body.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Product API - Testes de Integração', () => {

  it('should create a product with images, options and categories', async () => {
    const fullProduct = {
      enabled: true,
      name: "Tênis de Corrida Pro", // Enviando como name
      slug: "tenis-corrida-pro-01",
      stock: 50,
      description: "Tênis de alta performance.",
      price: 599.90, // Enviando como price
      price_with_discount: 499.90,
      category_ids: [categoryId],
      images: [
        { content: "base64-imagem-01" }
      ],
      options: [
        { title: "Cor", shape: "square", type: "text", values: ["Azul", "Preto"] }
      ]
    };

    const res = await request(app)
      .post('/v1/produto')
      .set('Authorization', `Bearer ${token}`)
      .send(fullProduct);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    productId = res.body.id;
  });

  it('should get product by ID including images and options', async () => {
    const res = await request(app).get(`/v1/produto/${productId}`);

    expect(res.statusCode).toEqual(200);
    // AJUSTADO: Agora procuramos por .name em vez de .nome
    expect(res.body.name).toBe("Tênis de Corrida Pro");
    expect(res.body).toHaveProperty('images');
    expect(res.body).toHaveProperty('options');
  });

  it('should filter products by price-range query param', async () => {
    const res = await request(app).get('/v1/produto/pesquisa?price-range=400-700');

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    // AJUSTADO: Agora procuramos por .price em vez de .preco
    expect(res.body.data[0].price).toBeGreaterThanOrEqual(400);
    expect(res.body.data[0].price).toBeLessThanOrEqual(700);
  });

  it('should update product information and return 204', async () => {
    const res = await request(app)
      .put(`/v1/produto/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: "Tênis Atualizado",
        stock: 45
      });

    expect(res.statusCode).toEqual(204);
  });

  it('should delete product and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/produto/${productId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(204);
  });

  it('should return 404 when getting a deleted product', async () => {
    const res = await request(app).get(`/v1/produto/${productId}`);
    expect(res.statusCode).toEqual(404);
  });
});