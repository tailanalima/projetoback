require('dotenv').config();

module.exports = {
  dialect: process.env.DB_DIALECT || 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },

  logging: false,

  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  }
};