const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/User');

// Configuração de segurança para o ambiente de testes
process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';

// Define limite de tempo para operações assíncronas (30 segundos)
jest.setTimeout(30000);

/**
 * Setup inicial antes de rodar os testes de usuário.
 */
beforeAll(async () => {
  // Recria o banco de dados para garantir um estado limpo
  await sequelize.sync({ force: true }); 

  const testUser = {
    firstname: 'Test',
    surname: 'User',
    email: 'test.user@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };
  
// 1. Registra o primeiro usuário no sistema
  await request(app).post('/v1/user').send(testUser);

  // 2. Realiza o login para gerar o token que será usado nas rotas protegidas (PUT, DELETE, GET)
  const loginRes = await request(app)
    .post('/v1/user/token')
    .send({ email: testUser.email, password: testUser.password });
    
// Armazena dados globalmente para serem acessados em qualquer 'it' deste arquivo 
    global.token = loginRes.body.token;

  // Busca o usuário no banco para capturar o ID real gerado
    const User = require('../src/models/User');
  const createdUser = await User.findOne({ where: { email: testUser.email } });
  
  
  global.userId = createdUser.id; 
  global.testUser = testUser;
});

/**
 * Encerra a conexão com o banco após todos os testes.
 */
afterAll(async () => {
  await sequelize.close();
});

describe('User API', () => {

  // TESTE: Registro de novo usuário (Sucesso)
  it('should create a new user and return 201', async () => {
    const res = await request(app)
      .post('/v1/user')
      .send({
        firstname: 'Another',
        surname: 'User',
        email: 'another.user@example.com',
        password: '123456',
        confirmPassword: '123456',
      });

    expect(res.statusCode).toEqual(201);
  });

  // TESTE: Validação de E-mail Único (Regra de Negócio)
  it('should return 400 when creating a user with a duplicate email', async () => {
    const res = await request(app)
      .post('/v1/user')
      .send(global.testUser); // Tenta enviar o mesmo e-mail do beforeAll
    
    expect(res.statusCode).toEqual(400); // Indica Bad Request
  });

  // TESTE: Autenticação/Login
  it('should login the user and return a JWT token', async () => {
    const res = await request(app)
      .post('/v1/user/token')
      .send({ email: global.testUser.email, password: global.testUser.password });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  // TESTE: Busca de perfil por ID (Rota protegida)
  it('should get user information by ID and return 200', async () => {
    const res = await request(app)
      .get(`/v1/user/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`);

    expect(res.statusCode).toEqual(200);
  });

  // TESTE: Atualização de perfil
  it('should update the user and return 204', async () => {
    const res = await request(app)
      .put(`/v1/user/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`)
      .send({
        firstname: 'Updated',
        surname: 'Name',
        email: 'updated.user@example.com',
      });

    expect(res.statusCode).toEqual(204);
  });

  // TESTE: Remoção de usuário
  it('should delete the user and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/user/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`);

    expect(res.statusCode).toEqual(204);
  });

  // TESTE: Tentativa de acesso após exclusão
  it('should return 404 when trying to get a deleted user', async () => {
    const res = await request(app)
      .get(`/v1/user/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`);

    expect(res.statusCode).toEqual(404);
  });
});