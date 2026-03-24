# 🛒 E-commerce API - Geração Tech 3.0

API REST robusta para gerenciamento de um sistema de E-commerce, desenvolvida como projeto final. O sistema foi construído com foco em escalabilidade, segurança e integração com banco de dados na nuvem (**Supabase**).

---

## 🚀 Tecnologias e Ferramentas

- **Backend:** Node.js, Express.js
- **Banco de Dados:** PostgreSQL (Hospedado no **Supabase**)
- **ORM:** Sequelize
- **Segurança:** BCrypt (Criptografia de senhas) e JWT (Autenticação via Token)
- **Documentação:** Swagger (OpenAPI 3.0)
- **Testes:** Jest e Supertest

## ✨ Funcionalidades Principais

### 👤 Usuários
- Cadastro e Autenticação (Login) com geração de Token JWT.
- Criptografia de senhas para garantir a privacidade dos dados.
- Gerenciamento completo (Listar, Atualizar, Deletar).

### 📂 Categorias
- Listagem com suporte a paginação e escolha de campos.
- Filtros específicos para categorias que devem ser exibidas no menu principal.

### 📦 Produtos
- Sistema de cadastro complexo com associações (Imagens e Opções de produto).
- Relacionamento Muitos-para-Muitos com Categorias.
- Busca inteligente por termo (`match`) e filtros por faixa de preço (`price-range`).

## 🧪 Testes Automatizados

O projeto conta com uma suíte de **19 testes de integração**, garantindo que todos os fluxos críticos (Usuários, Categorias e Produtos) estejam funcionando conforme os requisitos.
<img width="737" height="426" alt="image" src="https://github.com/user-attachments/assets/9a11d924-1ca5-4847-b8d8-aeb1b6146b77" />

Para rodar a suíte de testes:
```bash
#para rodar os teste uma a um
npx jest --runInBand
#para rodar todos de uma vez
npm test
Status: 19/19 testes aprovados. ✅


⚙️ Como Instalar e Rodar
Clone o repositório:

Bash
git clone [https://github.com/tailanalima/projetoback]
Instale as dependências:

Bash
npm install
Configure as Variáveis de Ambiente:
Crie um arquivo .env na raiz do projeto com as suas credenciais do Supabase:

Snippet de código
# Configurações do Servidor
PORT=3000

# Configurações do Banco de Dados (PostgreSQL/Supabase)
DB_DIALECT=postgres
DB_HOST=seu_host_supabase
DB_USER=postgres
DB_PASS=sua_senha_supabase
DB_NAME=postgres
DB_PORT=5432

# Configurações usadas no meu projeto para fins de avaliação: 
PORT=3001

DB_HOST=aws-0-us-west-2.pooler.supabase.com
DB_PORT=5432
DB_USER=postgres.rjhovsnjajgwfmfuvnwi
DB_PASSWORD=projetotaigui
DB_NAME=postgres
DB_DIALECT=postgres

Inicie o servidor:

Bash
npm run dev
📖 Documentação (Swagger)
A documentação interativa da API pode ser acessada em:
http://localhost:3000/api-docs
````
O Swagger ficará assim:
<img width="720" height="425" alt="image" src="https://github.com/user-attachments/assets/6aeebcf8-1885-415a-bd0d-d6177f21a90e" />

<img width="716" height="732" alt="image" src="https://github.com/user-attachments/assets/914064d5-0f2a-4b5e-8c8b-8c473be5ccc8" />

<img width="715" height="291" alt="image" src="https://github.com/user-attachments/assets/91afd210-2725-4abc-88f0-0e5faad70d11" />


🎨 Desenvolvido por: Maria Tailana Ferreira Lima e Guilherme de Sousa Lima

🎓 Curso: Geração Tech 3.0




