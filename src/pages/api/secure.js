// pages/api/secure.js
import Cors from 'cors';
import initMiddleware from '../../lib/init-middleware';

const cors = initMiddleware(
  Cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  })
);

export default async function handler(req, res) {
  await cors(req, res);

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer my-secret-token') {
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }

  res.status(200).json({ message: 'You are authorized!' });
}
