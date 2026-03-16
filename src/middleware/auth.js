const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(400).json({ error: 'Token not provided.' });

  const [, token] = authHeader.split(' ');
  const secret = process.env.JWT_SECRET || 'geracao_tech_secret_key';

  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};