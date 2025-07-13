import Cors from 'cors';

const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  origin: ['http://localhost:3000', 'https://new-demo-chi.vercel.app'],
  credentials: true, // Optional: if you're using cookies or auth
});

export default cors;
