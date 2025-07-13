// pages/api/initiate-collection.js
import { sendRequest, MERCHANT_ID_VALUE } from '../../lib/paymentUtils';
import initMiddleware from './lib/init-middleware';
import cors from './lib/cors';

const corsMiddleware = initMiddleware(cors);

export default async function handler(req, res) {
  // Run the CORS middleware
  await corsMiddleware(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const data = {
    mch_id: MERCHANT_ID_VALUE,
    mch_order_no: 'ORDER' + Date.now(),
    notifyUrl: 'https://new-demo-chi.vercel.app/',
    page_url: 'https://new-demo-chi.vercel.app/',
    trade_amount: '100',
    currency: 'INR',
    pay_type: 'INDIA_EXPRESS',
    payer_phone: '1234567890',
    attach: 'custom-attach'
  };

  try {
    const response = await sendRequest('/api/payGate/payCollect', data);
    res.status(200).json(response);
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
