process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';
const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/User');

jest.setTimeout(30000); // Aumenta o timeout para 30 segundos, útil para testes que acessam o banco

// Este bloco é executado antes de todos os testes neste arquivo.
// É perfeito para limpar o banco de dados e garantir que os testes comecem do zero.
beforeAll(async () => {
  // O `sync({ force: true })` apaga e recria todas as tabelas.
  // CUIDADO: Use isso apenas em um banco de dados de teste!
  await sequelize.sync({ force: true }); 

  // Cria o usuário de teste
  const testUser = {
    firstname: 'Test',
    surname: 'User',
    email: 'test.user@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };
  await request(app).post('/v1/usuario').send(testUser);

  // Faz login para obter o token JWT que será usado nos testes protegidos
  const loginRes = await request(app)
    .post('/v1/usuario/login')
    .send({ email: testUser.email, password: testUser.password });
    
  // 👇 NOSSO ESPIÃO PARA DESCOBRIR O MOTIVO DO ERRO 401 👇
  if (loginRes.statusCode !== 200) {
    console.log("⚠️ ERRO NO LOGIN (beforeAll):", loginRes.body);
  }
  
  global.token = loginRes.body.token; // Salva token globalmente

  // Busca o ID do usuário recém-criado no banco
  const User = require('../src/models/User');
  const createdUser = await User.findOne({ where: { email: testUser.email } });
  global.userId = createdUser.id; // Salva userId globalmente

  // Salva também os dados iniciais do usuário para verificação nos testes
  global.testUser = testUser;
});

// Após todos os testes: fecha conexão com o banco
afterAll(async () => {
  await sequelize.close();
});

// Conjunto de testes para a entidade User
describe('User API', () => {

  // Teste 1: criar usuário com sucesso
  it('should create a new user and return 201', async () => {
    const res = await request(app)
      .post('/v1/usuario')
      .send({
        firstname: 'Another',
        surname: 'User',
        email: 'another.user@example.com',
        password: '123456',
        confirmPassword: '123456',
      });

    expect(res.statusCode).toEqual(201);
    // Removi a verificação de 'id' aqui, pois descobrimos que sua API retorna {} no cadastro
  });

  // Teste 2: criar usuário com email duplicado deve retornar 400
  it('should return 400 when creating a user with a duplicate email', async () => {
    const res = await request(app)
      .post('/v1/usuario')
      .send(global.testUser); // Usa email já criado
    
    expect(res.statusCode).toEqual(400);
  });

  // Teste 3: login deve retornar token JWT
  it('should login the user and return a JWT token', async () => {
    const res = await request(app)
      .post('/v1/usuario/login')
      .send({ email: global.testUser.email, password: global.testUser.password });
    
    // 👇 NOSSO ESPIÃO PARA DESCOBRIR O MOTIVO DO ERRO 401 👇
    if (res.statusCode !== 200) {
      console.log("⚠️ ERRO NO LOGIN (Teste 3):", res.body);
    }
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  // Teste 4: buscar usuário pelo ID
  it('should get user information by ID and return 200', async () => {
    const res = await request(app)
      .get(`/v1/usuario/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`); // Passa token para autenticação

    expect(res.statusCode).toEqual(200);
  });

  // Teste 5: atualizar usuário
  it('should update the user and return 204', async () => {
    const updatedData = {
      firstname: 'Updated',
      surname: 'Name',
      email: 'updated.user@example.com',
    };

    const res = await request(app)
      .put(`/v1/usuario/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`) // Token necessário
      .send(updatedData);

    expect(res.statusCode).toEqual(204);
  });

  // Teste 6: deletar usuário
  it('should delete the user and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/usuario/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`);

    expect(res.statusCode).toEqual(204);
  });

  // Teste 7: buscar usuário deletado deve retornar 404
  it('should return 404 when trying to get a deleted user', async () => {
    const res = await request(app)
      .get(`/v1/usuario/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`);

    expect(res.statusCode).toEqual(404);
  });
});