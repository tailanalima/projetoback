require('dotenv').config();

module.exports = {
  // Define o banco de dados (Postgres por padrão) e credenciais de acesso
  dialect: process.env.DB_DIALECT || 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Configurações de segurança para conexões remotas (SSL)
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },

  logging: false,

  // Configurações globais para os modelos (tabelas)
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  }
};