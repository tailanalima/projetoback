const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Captura o cabeçalho 'Authorization' da requisição HTTP
  const authHeader = req.headers.authorization;
  
  // Se o cabeçalho não existir, barra a requisição com erro 400
  if (!authHeader) return res.status(400).json({ error: 'Token not provided.' });

  // O formato do cabeçalho é "Bearer <TOKEN>". 
  // O .split(' ') divide a string e o [ , token] pega apenas a segunda parte.
  const [, token] = authHeader.split(' ');
  
  // Define a chave secreta (usando o .env ou a chave de fallback para testes)
  const secret = process.env.JWT_SECRET || 'geracao_tech_secret_key';

  try {
    // Tenta verificar se o token é legítimo e não expirou
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id;
    // Libera a passagem para o próximo passo (Middleware ou Controller)
    return next();
  } catch (err) {
    // Se o token for falso, expirado ou inválido, retorna erro 401 (Não Autorizado)
    return res.status(401).json({ error: 'Invalid token.' });
  }
};