// pages/api/initiate-order.js
import { sendRequest, MERCHANT_ID_VALUE } from '../../lib/paymentUtils';

export default async function handler(req, res) {
    const data = {
        mch_id: MERCHANT_ID_VALUE,
        mch_order_no: 'TRANS' + Date.now(),
        notifyUrl: 'https://new-demo-chi.vercel.app/',
        page_url: 'https://new-demo-chi.vercel.app/',
        transfer_amount: '100',
        account: '123456789',
        userName: 'John Doe',
        reserve1: 'Bank or note',
        currency: 'INR',
        pay_type: 'INDIA_EXPRESS',
        attach: 'transfer-attach'
    };
    const response = await sendRequest('/api/payGate/payOrder', data);
    res.status(200).json(response);
}
