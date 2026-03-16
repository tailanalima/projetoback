const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models/User');

// Chaves para o Token
process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';

jest.setTimeout(30000);

beforeAll(async () => {
  await sequelize.sync({ force: true }); 

  const testUser = {
    firstname: 'Test',
    surname: 'User',
    email: 'test.user@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };
  
  // Rota corrigida: /v1/user
  await request(app).post('/v1/user').send(testUser);

  // Rota corrigida: /v1/user/token
  const loginRes = await request(app)
    .post('/v1/user/token')
    .send({ email: testUser.email, password: testUser.password });
    
  global.token = loginRes.body.token;

  const User = require('../src/models/User');
  const createdUser = await User.findOne({ where: { email: testUser.email } });
  
  // Agora createdUser não será null porque a rota acima funcionou!
  global.userId = createdUser.id; 
  global.testUser = testUser;
});

afterAll(async () => {
  await sequelize.close();
});

describe('User API', () => {

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

  it('should return 400 when creating a user with a duplicate email', async () => {
    const res = await request(app)
      .post('/v1/user')
      .send(global.testUser);
    
    expect(res.statusCode).toEqual(400);
  });

  it('should login the user and return a JWT token', async () => {
    const res = await request(app)
      .post('/v1/user/token')
      .send({ email: global.testUser.email, password: global.testUser.password });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should get user information by ID and return 200', async () => {
    const res = await request(app)
      .get(`/v1/user/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`);

    expect(res.statusCode).toEqual(200);
  });

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

  it('should delete the user and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/user/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`);

    expect(res.statusCode).toEqual(204);
  });

  it('should return 404 when trying to get a deleted user', async () => {
    const res = await request(app)
      .get(`/v1/user/${global.userId}`)
      .set('Authorization', `Bearer ${global.token}`);

    expect(res.statusCode).toEqual(404);
  });
});