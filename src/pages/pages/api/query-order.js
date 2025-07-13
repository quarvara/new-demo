// pages/api/query-order.js
import { sendRequest, MERCHANT_ID_VALUE } from '../../lib/paymentUtils';

export default async function handler(req, res) {
    const { order_no } = req.body;
    const data = {
        mch_id: MERCHANT_ID_VALUE,
        mch_order_no: order_no || 'ORDER123'
    };
    const response = await sendRequest('/api/query/payOrder', data);
    res.status(200).json(response);
}
