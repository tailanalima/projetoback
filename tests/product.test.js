const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/User'); 

// Configuração de ambiente para garantir consistência nos tokens JWT durante o teste
process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';

// Define limite de tempo para operações assíncronas (30 segundos)
jest.setTimeout(30000); 

let token; // Armazena o token do Admin
let categoryId; // Necessário para vincular o produto a uma categoria real
let productId; // Armazena o ID do produto criado para ser usado nos testes de PUT/GET/DELETE

/**
 * Preparação do ambiente de teste (Setup)
 */

beforeAll(async () => {
  // Limpa e recria o banco de dados antes de iniciar os testes
  await sequelize.sync({ force: true });
  
  // 1. Cria um usuário Admin para as rotas protegidas 
  await request(app).post('/v1/user').send({
      firstname: 'Admin', 
      surname: 'Products', 
      email: 'admin.prod@example.com',
      password: 'password123', 
      confirmPassword: 'password123',
  });

  // 2. Realiza o login para obter o token Bearer 
  const tokenRes = await request(app).post('/v1/user/token').send({
      email: 'admin.prod@example.com', 
      password: 'password123',
  });
  token = tokenRes.body.token;

  // 3. Cria uma categoria, pois produtos geralmente exigem uma associação válida
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

/**
 * Finalização do ambiente de teste (Teardown)
 */
afterAll(async () => {
  await sequelize.close(); // Fecha a conexão para não travar o processo do Jest
});

describe('Product API - Integration Tests', () => {

  // TESTE: Criação completa de produto
  it('should create a product with images, options and categories', async () => {
    const fullProduct = {
      enabled: true,
      name: "Tênis Pro Plus", 
      slug: "tenis-pro-plus-01",
      stock: 50,
      description: "Alta performance.",
      price: 599.90, 
      price_with_discount: 499.90,
      category_ids: [categoryId], // Usa o ID criado no beforeAll
      images: [{ content: "base64-image-data" }], // Simulação de envio de imagem
      options: [{ title: "Color", shape: "square", type: "text", values: ["Blue", "Black"] }]
    };

    const res = await request(app)
      .post('/v1/product') 
      .set('Authorization', `Bearer ${token}`)
      .send(fullProduct);

    expect(res.statusCode).toEqual(201); // Verifica se foi criado
    expect(res.body).toHaveProperty('id');
    productId = res.body.id; // Armazena para os próximos testes
  });

  // TESTE: Busca por ID
  it('should get product by ID', async () => {
    const res = await request(app).get(`/v1/product/${productId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe("Tênis Pro Plus");
  });

  // TESTE: Filtro de busca por preço (Query Params)
  it('should filter products by price-range query param', async () => {
  
  // Simula uma busca na URL: /v1/product/search?price-range=400-700
    const res = await request(app).get('/v1/product/search?price-range=400-700');

  expect(res.statusCode).toEqual(200);
  expect(res.body.data.length).toBeGreaterThan(0); // Garante que o produto criado foi encontrado
  
  
  // Converte e valida se o preço retornado está dentro da faixa solicitada
  const price = Number(res.body.data[0].price); 
  expect(price).toBeGreaterThanOrEqual(400);
  expect(price).toBeLessThanOrEqual(700);
});

// TESTE: Atualização parcial de dados  
it('should update product information and return 204', async () => {
    const res = await request(app)
      .put(`/v1/product/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Updated Sneaker", stock: 45 });
    expect(res.statusCode).toEqual(204); // Padrão REST: Sucesso sem corpo no retorno
  });

  // TESTE: Deleção de produto
  it('should delete product and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/product/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);
  });

  // TESTE: Validação de integridade após deleção
  it('should return 404 when getting a deleted product', async () => {
    const res = await request(app).get(`/v1/product/${productId}`);
    expect(res.statusCode).toEqual(404); // Deve retornar "Não Encontrado"
  });
});