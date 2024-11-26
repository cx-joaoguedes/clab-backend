const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwt_secret = process.env.AUTH_JWT_SECRET

const authenticate = (req, res, next) => {
  const token = req.cookies.sk_token;

  if (!token) return res.status(400).send('Missing sk_token');
  

  try {
    const verified = jwt.verify(token, jwt_secret);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

module.exports = authenticate;