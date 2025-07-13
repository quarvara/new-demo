// components/Settings.js

import { useFormik } from 'formik';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { useToasts } from 'react-toast-notifications';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const Settings = () => {
    const { addToast } = useToasts();
    const [products, setProducts] = useState({
        upi: '',
        Bhim: false,
        Gpay: false,
        Paytm: false,
        Phonepe: false,
        WPay: false,
    });
    const [products1, setProducts1] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const res = await fetch('/api/upichange', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();
            setProducts({
                upi: data.upi?.upi || '',
                Bhim: !!data.upi?.Bhim,
                Gpay: !!data.upi?.Gpay,
                Paytm: !!data.upi?.Paytm,
                Phonepe: !!data.upi?.Phonepe,
                WPay: !!data.upi?.WPay,
            });
            setProducts1(data?.pixelId?.FacebookPixel || '');
        } catch {
            addToast('Failed to fetch UPI settings', { appearance: 'error' });
        }
    }

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            upi: products.upi,
            Bhim: products.Bhim,
            Gpay: products.Gpay,
            Paytm: products.Paytm,
            Phonepe: products.Phonepe,
            WPay: products.WPay,
        },
        onSubmit: async (values) => {
            try {
                const res = await fetch('/api/upichange', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(values),
                });
                const data = await res.json();
                if (data.status === 1) {
                    addToast('UPI submitted successfully', { appearance: 'success' });
                    setProducts(values);
                } else {
                    addToast('Error submitting UPI', { appearance: 'error' });
                }
            } catch {
                addToast('Submission failed', { appearance: 'error' });
            }
        },
    });

    const formik1 = useFormik({
        enableReinitialize: true,
        initialValues: {
            pixelId: products1,
        },
        onSubmit: async (values) => {
            try {
                const res = await fetch('/api/facebookPixel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(values),
                });
                const data = await res.json();
                if (data.status === 1) {
                    addToast('Pixel submitted successfully', { appearance: 'success' });
                    setProducts1(values.pixelId);
                } else {
                    addToast('Error submitting Pixel', { appearance: 'error' });
                }
            } catch {
                addToast('Error submitting pixel', { appearance: 'error' });
            }
        },
    });

    const formik2 = useFormik({
        initialValues: {
            amount: '',
            transaction_mode: 'IMPS',
            account_number: '',
            ifsc_code: '',
            name: '',
            email: '',
            mobile: '',
        },
        validationSchema: Yup.object({
            amount: Yup.number().min(1, 'Must be at least 1').required('Amount is required'),
            transaction_mode: Yup.string().required('Mode is required'),
            account_number: Yup.string().min(10, 'Too short').required('Account number required'),
            ifsc_code: Yup.string()
                .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC')
                .required('IFSC required'),
            name: Yup.string().required('Name required'),
            email: Yup.string().email('Invalid email').required('Email required'),
            mobile: Yup.string()
                .matches(/^\d{10}$/, 'Enter valid 10-digit mobile')
                .required('Mobile required'),
        }),
        onSubmit: async ({
            amount,
            transaction_mode,
            account_number,
            ifsc_code,
            name,
            email,
            mobile }, { resetForm }) => {
            try {
                const response = await axios.post(
                    '/api/payment/payout',
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
                res.status(200).json(response.data);
                addToast('Payout failed: ' + errorMessage, { appearance: 'error' });
            } catch (err) {
                addToast('API error: ' + err.message, { appearance: 'error' });
            }
        },
    });

    return (
        <div className="container py-4">
            <nav className="navbar navbar-light bg-white shadow-sm mb-4 px-3 rounded">
                <h2 className="navbar-brand fw-bold text-primary m-auto">Admin Panel</h2>
            </nav>

            <div className="row g-4">
                {/* UPI / Token Settings */}
                <div className="col-lg-6">
                    <div className="card shadow-lg">
                        <div className="card-header bg-primary text-white">
                            <h5>🔑 UPI / Token Settings</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={formik.handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">API Token</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="upi"
                                        value={formik.values.upi}
                                        onChange={(e) => {
                                            formik.handleChange(e);
                                            setProducts((prev) => ({ ...prev, upi: e.target.value }));
                                        }}
                                    />
                                </div>

                                <label className="form-label">Enable UPI Methods</label>
                                <div className="row">
                                    {['Gpay', 'Phonepe', 'Paytm', 'Bhim', 'WPay'].map((method) => (
                                        <div className="col-6 col-md-4" key={method}>
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name={method}
                                                    checked={formik.values[method]}
                                                    onChange={(e) => {
                                                        formik.setFieldValue(method, e.target.checked);
                                                        setProducts((prev) => ({ ...prev, [method]: e.target.checked }));
                                                    }}
                                                    id={`${method}Switch`}
                                                />
                                                <label className="form-check-label" htmlFor={`${method}Switch`}>
                                                    {method}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button type="submit" className="btn btn-primary w-100 mt-3">
                                    💾 Save Settings
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Facebook Pixel */}
                <div className="col-lg-6">
                    <div className="card shadow-sm">
                        <div className="card-header bg-info text-white">
                            <h5>📈 Facebook Pixel</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={formik1.handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Pixel ID</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        name="pixelId"
                                        value={formik1.values.pixelId}
                                        onChange={(e) => {
                                            formik1.handleChange(e);
                                            setProducts1(e.target.value);
                                        }}
                                    />
                                </div>
                                <button type="submit" className="btn btn-info w-100 text-white">
                                    💾 Save Pixel
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Payout Form */}
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-success text-white">
                            <h5>💸 Payout Form</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={formik2.handleSubmit}>
                                <div className="row g-3">
                                    {Object.entries(formik2.initialValues).map(([key]) => (
                                        <div className="col-md-6" key={key}>
                                            <label className="form-label">{key.replace(/_/g, ' ').toUpperCase()}</label>
                                            <input
                                                type={key === 'amount' ? 'number' : 'text'}
                                                name={key}
                                                className="form-control"
                                                placeholder={`Enter ${key.replace('_', ' ')}`}
                                                value={formik2.values[key]}
                                                onChange={formik2.handleChange}
                                                onBlur={formik2.handleBlur}
                                            />
                                            {formik2.touched[key] && formik2.errors[key] && (
                                                <small className="text-danger">{formik2.errors[key]}</small>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button type="submit" className="btn btn-success w-100 mt-3">
                                    🚀 Initiate Payout
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
