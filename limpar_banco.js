const Sequelize = require('sequelize');
const dbConfig = require('./src/config/database'); // Ajuste o caminho do seu config
const sequelize = new Sequelize(dbConfig);

async function limpar() {
  try {
    console.log("Iniciando limpeza das tabelas antigas...");
    
    // Lista das tabelas em português para apagar
    const tabelasParaApagar = [
      'produtos_categorias',
      'imagens_produtos',
      'opcoes_produtos',
      'produtos',
      'categorias',
      'usuarios'
    ];

    for (const tabela of tabelasParaApagar) {
      await sequelize.query(`DROP TABLE IF EXISTS "${tabela}" CASCADE;`);
      console.log(`✅ Tabela "${tabela}" removida.`);
    }

    console.log("\n✨ Banco de dados limpo com sucesso!");
    process.exit();
  } catch (error) {
    console.error("❌ Erro ao limpar:", error.message);
    process.exit(1);
  }
}

limpar();