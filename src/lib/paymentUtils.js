// /lib/paymentUtils.js
import crypto from 'crypto';
import axios from 'axios';

// Merchant credentials
const MERCHANT_ID = '86458748';
const MERCHANT_KEY = '51a18f55cd606c381a53aced77f8447e';
const BASE_URL = 'https://xyu10.top';

export function generateSignature(data, secretKey) {
    const filtered = Object.keys(data)
        .filter(key => data[key] !== null && data[key] !== '' && key !== 'sign' && key !== 'sign_type')
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('&');
    const stringToSign = `${filtered}&key=${secretKey}`;
    return crypto.createHash('md5').update(stringToSign).digest('hex').toLowerCase();
}

export async function sendRequest(path, data) {
    data.sign = generateSignature(data, MERCHANT_KEY);
    data.sign_type = 'MD5';

    try {
        const response = await axios.post(BASE_URL + path, new URLSearchParams(data), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return response.data;
    } catch (error) {
        return { error: error.message };
    }
}

export const MERCHANT_ID_VALUE = MERCHANT_ID;
