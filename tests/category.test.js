const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/User');

// Garantimos que o Jest tenha as chaves para assinar o Token
process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';

jest.setTimeout(30000); 
let token;

// Preparamos o ambiente criando um usuário e pegando o token
beforeAll(async () => {
  await sequelize.sync({ force: true });
  
  // Criamos o admin usando as chaves que o seu UserController espera
  await request(app)
    .post('/v1/usuario')
    .send({
      firstname: 'Admin',
      surname: 'Categorias',
      email: 'admin.cat@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

  // Fazemos o login na rota correta (/login)
  const res = await request(app)
    .post('/v1/usuario/login')
    .send({
      email: 'admin.cat@example.com',
      password: 'password123',
    });
    
  token = res.body.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Category API', () => {
  let categoryId;
  const testCategory = {
    nome: 'Eletrônicos',
    slug: 'eletronicos',
    use_in_menu: true,
  };

  it('should create a new category and return 201', async () => {
    const res = await request(app)
      .post('/v1/categoria')
      .set('Authorization', `Bearer ${token}`)
      .send(testCategory);
    
    expect(res.statusCode).toEqual(201);
  });
  
  it('should get a list of categories', async () => {
    const res = await request(app).get('/v1/categoria/pesquisa');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array);
    // Verificamos o primeiro item da lista
    expect(res.body.data[0].nome).toBe(testCategory.nome);
    categoryId = res.body.data[0].id; 
  });

  it('should get a category by ID', async () => {
    const res = await request(app).get(`/v1/categoria/${categoryId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.slug).toBe(testCategory.slug);
  });

  it('should update a category and return 204', async () => {
    const res = await request(app)
      .put(`/v1/categoria/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Eletrônicos e Gadgets', slug: 'eletronicos-gadgets' });
    
    expect(res.statusCode).toEqual(204);
  });

  it('should delete a category and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/categoria/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(204);
  });
  
  it('should return 404 when getting a deleted category', async () => {
    const res = await request(app).get(`/v1/categoria/${categoryId}`);
    expect(res.statusCode).toEqual(404);
  });
});