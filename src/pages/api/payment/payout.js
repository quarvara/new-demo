import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    amount,
    transaction_mode,
    account_number,
    ifsc_code,
    name,
    email,
    mobile,
  } = req.body;

  if (
    !amount ||
    !transaction_mode ||
    !account_number ||
    !ifsc_code ||
    !name ||
    !email ||
    !mobile
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await axios.post(
      'http://meefo.shop:4000/api/paymentlink?action=payout',
      {
        amount,
        transaction_mode,
        account_number,
        ifsc_code,
        name,
        email,
        mobile,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        maxBodyLength: Infinity,
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Payout API error:', error.response?.data || error.message || error);
    return res.status(500).json({
      error: 'Failed to process payout',
      details: error.response?.data || error.message || 'Unknown error',
    });
  }
}
