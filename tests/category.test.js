const request = require('supertest');
const app = require('../src/app');
const database = require('../src/database'); 
const sequelize = database.connection;

// Chaves para assinar o Token nos testes
process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';

jest.setTimeout(30000); 
let token;

beforeAll(async () => {
  // ATENÇÃO: Reinicia o banco para garantir que as tabelas em inglês existam
  await sequelize.sync({ force: true });
  
  // 1. Cria o usuário Admin
  await request(app).post('/v1/user').send({
    firstname: 'Admin',
    surname: 'Test',
    email: 'admin@test.com',
    password: '123',
    confirmPassword: '123'
  });

  // 2. Faz o login
  const res = await request(app).post('/v1/user/token').send({
    email: 'admin@test.com',
    password: '123'
  });
    
  token = res.body.token;
  
  if (!token) {
    // Se falhar, isso vai imprimir o erro real no seu terminal
    console.error("🚨 LOGIN FAILED! Status:", res.status, "Body:", res.body);
  }
});

afterAll(async () => {
  await sequelize.close();
});

describe('Category API', () => {
  let categoryId;
  const testCategory = {
    name: 'Eletrônicos', // Ajustado de 'nome' para 'name'
    slug: 'eletronicos',
    use_in_menu: true,
  };

  it('should create a new category and return 201', async () => {
    const res = await request(app)
      .post('/v1/category') // Rota atualizada: /v1/category
      .set('Authorization', `Bearer ${token}`)
      .send(testCategory);
    
    expect(res.statusCode).toEqual(201);
  });
  
  it('should get a list of categories', async () => {
    // Rota atualizada: /v1/category/search (conforme Requisito 01, Seção 03)
    const res = await request(app).get('/v1/category/search');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    // Verificamos o campo 'name' no primeiro item
    expect(res.body.data[0].name).toBe(testCategory.name);
    categoryId = res.body.data[0].id; 
  });

  it('should get a category by ID', async () => {
    const res = await request(app).get(`/v1/category/${categoryId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.slug).toBe(testCategory.slug);
  });

  it('should update a category and return 204', async () => {
    const res = await request(app)
      .put(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Eletrônicos e Gadgets', slug: 'eletronicos-gadgets' });
    
    expect(res.statusCode).toEqual(204);
  });

  it('should delete a category and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(204);
  });
  
  it('should return 404 when getting a deleted category', async () => {
    const res = await request(app).get(`/v1/category/${categoryId}`);
    expect(res.statusCode).toEqual(404);
  });
});