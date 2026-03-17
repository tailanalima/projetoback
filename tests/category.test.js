const request = require('supertest');
const app = require('../src/app');
const database = require('../src/database'); 
const sequelize = database.connection;

// Configuração de variáveis de ambiente para o ambiente de testes
// Garante que o JWT use uma chave fixa e não dependa de arquivos .env externos
process.env.JWT_SECRET = 'minha_chave_secreta_de_teste';
process.env.JWT_EXPIRES_IN = '1h';

// Define limite de tempo para operações assíncronas (30 segundos)
jest.setTimeout(30000); 
let token; // Variável global para armazenar o token de autenticação

/**
 * Hook executado antes de todos os testes do arquivo.
 * Prepara o ambiente: limpa o banco, cria um usuário e obtém o token.
 */
beforeAll(async () => {
  // Sincroniza o banco de dados
  await sequelize.sync({ force: true });
  

  // 1. Cria o usuário Admin
  await request(app).post('/v1/user').send({
    firstname: 'Admin',
    surname: 'Test',
    email: 'admin@test.com',
    password: '123',
    confirmPassword: '123'
  });

  // 2. Realiza o login para capturar o Bearer Token
  const res = await request(app).post('/v1/user/token').send({
    email: 'admin@test.com',
    password: '123'
  });
    
  token = res.body.token;
  
  // Log de erro caso o login falhe, facilitando o debug no terminal
  if (!token) {

    console.error("🚨 LOGIN FAILED! Status:", res.status, "Body:", res.body);
  }
});
/**
 * Hook executado após todos os testes para fechar a conexão com o banco.
 */
afterAll(async () => {
  await sequelize.close();
});

describe('Category API', () => {
  let categoryId; // Armazena o ID da categoria criada para usar nos testes seguintes
  const testCategory = {
    name: 'Eletrônicos', 
    slug: 'eletronicos',
    use_in_menu: true,
  };

  // TESTE: Criação de Categoria (Rota protegida)
  it('should create a new category and return 201', async () => {
    const res = await request(app)
      .post('/v1/category') 
      .set('Authorization', `Bearer ${token}`)
      .send(testCategory);
    
    expect(res.statusCode).toEqual(201);
  });
  
  // TESTE: Listagem/Busca de Categorias
  it('should get a list of categories', async () => {

    const res = await request(app).get('/v1/category/search');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toBeInstanceOf(Array); // Verifica se o retorno é uma lista
   
    // Verifica se o nome da categoria criada anteriormente está presente
    expect(res.body.data[0].name).toBe(testCategory.name);
    categoryId = res.body.data[0].id; // Salva o ID real retornado pelo banco
  });

  // TESTE: Busca de categoria específica por ID
  it('should get a category by ID', async () => {
    const res = await request(app).get(`/v1/category/${categoryId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.slug).toBe(testCategory.slug);
  });

  // TESTE: Atualização de Categoria (Rota protegida)
  it('should update a category and return 204', async () => {
    const res = await request(app)
      .put(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Eletrônicos e Gadgets', slug: 'eletronicos-gadgets' });
    
    expect(res.statusCode).toEqual(204); // 204 indica sucesso sem corpo de resposta
  });

  // TESTE: Exclusão de Categoria (Rota protegida)
  it('should delete a category and return 204', async () => {
    const res = await request(app)
      .delete(`/v1/category/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(204);
  });
  
  // TESTE: Verificação de remoção (Garante que o item realmente não existe mais)
  it('should return 404 when getting a deleted category', async () => {
    const res = await request(app).get(`/v1/category/${categoryId}`);
    expect(res.statusCode).toEqual(404);
  });
});