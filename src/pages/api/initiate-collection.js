// pages/api/initiate-collection.js
import { sendRequest, MERCHANT_ID_VALUE } from '../../lib/paymentUtils';

export default async function handler(req, res) {
    const data = {
        mch_id: MERCHANT_ID_VALUE,
        mch_order_no: 'ORDER' + Date.now(),
        notifyUrl: 'https://kitchesmisale.vercel.app/',
        page_url: 'https://kitchesmisale.vercel.app/',
        trade_amount: '100',
        currency: 'INR',
        pay_type: 'INDIA_EXPRESS',
        payer_phone: '1234567890',
        attach: 'custom-attach'
    };
    const response = await sendRequest('/api/payGate/payCollect', data);
    res.status(200).json(response);
}
