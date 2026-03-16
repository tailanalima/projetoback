const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/User'); 

process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';

jest.setTimeout(30000); 

let token;
let categoryId;
let productId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  
  // 1. Cria usuário Admin (Rota: /v1/user)
  await request(app).post('/v1/user').send({
      firstname: 'Admin', 
      surname: 'Products', 
      email: 'admin.prod@example.com',
      password: 'password123', 
      confirmPassword: 'password123',
  });

  // 2. Login (Rota: /v1/user/token)
  const tokenRes = await request(app).post('/v1/user/token').send({
      email: 'admin.prod@example.com', 
      password: 'password123',
  });
  token = tokenRes.body.token;

  // 3. Cria categoria (Rota: /v1/category)
  const catRes = await request(app)
    .post('/v1/category')
    .set('Authorization', `Bearer ${token}`)
    .send({ 
        name: 'Shoes', 
        slug: 'shoes', 
        use_in_menu: true 
    });
  categoryId = catRes.body.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Product API - Integration Tests', () => {

  it('should create a product with images, options and categories', async () => {
    const fullProduct = {
      enabled: true,
      name: "Tênis Pro Plus", // name em inglês
      slug: "tenis-pro-plus-01",
      stock: 50,
      description: "Alta performance.",
      price: 599.90, // price em inglês
      price_with_discount: 499.90,
      category_ids: [categoryId],
      images: [{ content: "base64-image-data" }],
      options: [{ title: "Color", shape: "square", type: "text", values: ["Blue", "Black"] }]
    };

    const res = await request(app)
      .post('/v1/product') // Rota: /v1/product
      .set('Authorization', `Bearer ${token}`)
      .send(fullProduct);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    productId = res.body.id;
  });

  it('should get product by ID', async () => {
    const res = await request(app).get(`/v1/product/${productId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe("Tênis Pro Plus");
  });

  it('should filter products by price-range query param', async () => {
  const res = await request(app).get('/v1/product/search?price-range=400-700');

  expect(res.statusCode).toEqual(200);
  expect(res.body.data.length).toBeGreaterThan(0);
  
  // Convertemos para Number() antes da comparação
  const price = Number(res.body.data[0].price); 
  expect(price).toBeGreaterThanOrEqual(400);
  expect(price).toBeLessThanOrEqual(700);
});

  it('should update product information and return 204', async () => {
    const res = await request(app)
      .put(`/v1/product/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Updated Sneaker", stock: 45 });
    expect(res.statusCode).toEqual(204);
  });

  it('should delete product and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/product/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);
  });

  it('should return 404 when getting a deleted product', async () => {
    const res = await request(app).get(`/v1/product/${productId}`);
    expect(res.statusCode).toEqual(404);
  });
});