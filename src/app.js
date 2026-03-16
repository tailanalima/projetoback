require('dotenv').config();
require('./database');

const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Importação das rotas
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

class App {
  constructor() {
    this.server = express();
    this.middlewares();
    this.swaggerConfig(); // Organiza a documentação Swagger
    this.routes();
  }

  middlewares() {
    this.server.use(cors());
    // Aumentamos o limite para aceitar as imagens em Base64 dos produtos
    this.server.use(express.json({ limit: '50mb' }));
  }

  swaggerConfig() {
    // Configuração oficial do Swagger conforme Requisitos de Documentação
    const swaggerOptions = {
      swaggerDefinition: {
        openapi: '3.0.0',
        info: {
          title: 'API Geração Tech 3.0 - E-commerce',
          version: '1.0.0',
          description: 'Documentação completa dos endpoints de Usuários, Categorias e Produtos.',
        },
        servers: [
          {
            url: `http://localhost:${process.env.PORT || 3001}`,
            description: 'Ambiente de Desenvolvimento Local',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: { // Configuração para testar rotas protegidas com JWT no Swagger
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      // Localização dos arquivos que contêm as anotações @swagger
      apis: ['./src/routes/*.js'], 
    };

    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    this.server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }

  routes() {
    // SEÇÃO 02: Endpoints de Usuários (Padrão: /v1/user)
    this.server.use('/v1/user', userRoutes);

    // SEÇÃO 03: Endpoints de Categorias (Padrão: /v1/category)
    this.server.use('/v1/category', categoryRoutes);

    // SEÇÃO 04: Endpoints de Produtos (Padrão: /v1/product)
    this.server.use('/v1/product', productRoutes);
  }
}

// Exportamos apenas o servidor para os testes e o server.js
module.exports = new App().server;