"use client";
import axios from "axios";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import "../payment.module.css";

const Payments = () => {
    // State management
    const [loading, setLoading] = useState({
        initial: true,
        paymentInit: false,
        verification: false,
        upiLoading: true
    });
    const [paymentData, setPaymentData] = useState({
        products: null,
        upiLinks: null,
        qrCode: '',
        transactionId: "",
        amount: 0
    });
    const [paymentStatus, setPaymentStatus] = useState({
        show: false,
        status: "pending", // pending, verifying, success, failed
        message: "",
        orderId: "",
        timer: 120
    });
    const [uiState, setUiState] = useState({
        activeTab: 2,
        paymentUrl: "",
        timeLeft: 300, // 5 minutes
        amount: 0
    });

    // Refs
    const verificationInterval = useRef(null);
    const timerInterval = useRef(null);
    const router = useRouter();

    // Constants
    const VERIFICATION_TIMEOUT = 120; // 2 minutes
    const OFFER_TIMEOUT = 300; // 5 minutes

    // Effects
    useEffect(() => {
        initializePayment();
        return () => cleanupIntervals();
    }, []);

    useEffect(() => {
        if (router.query.id) {
            const amount = parseFloat(router.query.id?.split('.')[0] || "0");
            setUiState(prev => ({...prev, amount}));
        }
    }, [router.query.id]);

    useEffect(() => {
        if (paymentStatus.status === "success") {
            redirectToSuccessPage();
        }
    }, [paymentStatus.status]);

    useEffect(() => {
        updatePaymentUrl();
    }, [uiState.activeTab, paymentData.upiLinks]);

    // Initialization
    const initializePayment = async () => {
        try {
            await loadProducts();
            localStorage.removeItem('paymentVerification');
            localStorage.removeItem('paymentVerification1');
            checkStoredVerification();
        } catch (error) {
            handleError("Failed to initialize payment", error);
        } finally {
            setLoading(prev => ({ ...prev, initial: false }));
        }
    };

    const loadProducts = async () => {
        try {
            const headers = {
                "Accept": "*/*",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            };

            const response = await fetch('/api/upichange', {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (!data.upi) throw new Error("No UPI data received");

            setPaymentData(prev => ({ 
                ...prev, 
                products: data.upi,
                amount: uiState.amount
            }));
            
            await initiatePayment(data.upi.upi);
            
            // Set default tab based on available methods
            const defaultTab = data.upi.Gpay === false ? 
                data.upi.Phonepe === false ? 4 : 3 : 2;
            setUiState(prev => ({ ...prev, activeTab: defaultTab }));
        } catch (error) {
            throw error;
        }
    };

    const initiatePayment = async (upiId) => {
        setLoading(prev => ({ ...prev, paymentInit: true, upiLoading: true }));
        
        try {
            const headers = {
                "Accept": "*/*",
                "token": upiId,
                "Content-Type": "application/json"
            };

            const body = JSON.stringify({ 
                token: upiId, 
                total: uiState.amount 
            });
            
            const response = await fetch(`/api/payment/initiate`, {
                method: "POST",
                body: body,
                headers: headers
            });

            if (!response.ok) throw new Error(`Payment initiation failed with status ${response.status}`);

            const data = await response.json();
            if (data.status !== "initiate") throw new Error(data.message || "Payment initiation failed");

            setPaymentData(prev => ({
                ...prev,
                upiLinks: data.data.upi_links,
                qrCode: data.data.qr_code,
                transactionId: data.data.transaction_id,
                amount: uiState.amount
            }));
        } catch (error) {
            updatePaymentStatus({
                show: true,
                status: "failed",
                message: error.message || "Payment initiation failed"
            });
            throw error;
        } finally {
            setLoading(prev => ({ ...prev, paymentInit: false, upiLoading: false }));
        }
    };

    // Payment verification
    const verifyPayment = async (orderId) => {
        if (!orderId || !paymentData.transactionId) return;

        updatePaymentStatus({
            show: true,
            status: "verifying",
            message: "Initializing payment verification...",
            orderId: orderId,
            timer: VERIFICATION_TIMEOUT
        });

        storeVerificationState(orderId, "verifying", "Initializing payment verification...");
        setLoading(prev => ({ ...prev, verification: true }));

        startVerificationTimer();
        await checkPaymentStatus(orderId);
    };

    const checkPaymentStatus = async (orderId) => {
        let attempts = 0;
        const maxAttempts = 60;
        let lastError = "";
        let isVerified = false;

        const performCheck = async () => {
            if (isVerified || attempts >= maxAttempts) return;

            try {
                updateStatusMessage(attempts);
                
                const res = await axios.post(`api/payment/status`, {
                    transaction_id: paymentData.transactionId
                });

                if (res.data?.data1?.data?.transaction_status === "success") {
                    isVerified = true;
                    handleSuccessfulPayment(res, orderId, attempts);
                } else {
                    lastError = res.data?.message || "Payment verification in progress...";
                }
            } catch (error) {
                lastError = error?.response?.data?.message || "Error verifying payment";
                console.error("Verification error:", error);
            }

            attempts++;
            if (attempts >= maxAttempts && !isVerified) {
                handleVerificationFailure(lastError, orderId);
            }
        };

        // Initial check
        await performCheck();
        
        // Set up interval for continuous checking
        verificationInterval.current = setInterval(performCheck, 3000);
    };

    const handleSuccessfulPayment = (response, orderId, attempts) => {
        const paymentData = {
            orderId: response.data.id,
            amount: response.data.amount,
            paymentMethod: "upi",
            referenceId: response.data.reference_id || null,
            verificationTime: new Date().toISOString(),
            attempts: attempts,
            status: 'success',
        };
        
        localStorage.setItem('paymentData', JSON.stringify(paymentData));
        localStorage.setItem('paymentVerification1', 
            `${response.data.data.data.transaction_status}==${response.data.data.data.transaction_id}`);
        
        clearInterval(verificationInterval.current);
        clearInterval(timerInterval.current);
        
        updatePaymentStatus({
            status: "success",
            message: "Payment Successful! Thank you for your payment."
        });
        
        setLoading(prev => ({ ...prev, verification: false }));
    };

    const handleVerificationFailure = (error, orderId) => {
        clearInterval(verificationInterval.current);
        clearInterval(timerInterval.current);

        updatePaymentStatus({
            status: "failed",
            message: error || "Payment verification timed out"
        });
        
        storeVerificationState(orderId, "failed", error || "Payment verification timed out");
        setLoading(prev => ({ ...prev, verification: false }));
    };

    // Timer functions
    const startVerificationTimer = () => {
        timerInterval.current = setInterval(() => {
            setPaymentStatus(prev => {
                if (prev.timer <= 1) {
                    clearInterval(timerInterval.current);
                    return { ...prev, timer: 0 };
                }
                return { ...prev, timer: prev.timer - 1 };
            });
        }, 1000);
    };

    const startOfferTimer = () => {
        const timer = setInterval(() => {
            setUiState(prev => ({
                ...prev,
                timeLeft: prev.timeLeft > 0 ? prev.timeLeft - 1 : 0
            }));
        }, 1000);
        return () => clearInterval(timer);
    };

    // Helper functions
    const updatePaymentUrl = () => {
        if (!paymentData.upiLinks) return;

        let paymentUrl;
        switch (uiState.activeTab) {
            case 1: paymentUrl = paymentData.upiLinks.bhim; break;
            case 2: paymentUrl = paymentData.upiLinks.gpay; break;
            case 3: paymentUrl = paymentData.upiLinks.phonepe; break;
            case 4: paymentUrl = paymentData.upiLinks.paytm; break;
            case 5: paymentUrl = paymentData.upiLinks.gpay; break;
            default: paymentUrl = paymentData.upiLinks.gpay; break;
        }

        setUiState(prev => ({ ...prev, paymentUrl }));
    };

    const updateStatusMessage = (attempts) => {
        const messages = [
            "Checking payment status...",
            "Still verifying payment...",
            "Payment verification in progress...",
            "Almost there..."
        ];
        const message = messages[Math.min(Math.floor(attempts/5), messages.length-1)];
        setPaymentStatus(prev => ({ ...prev, message }));
    };

    const updatePaymentStatus = (updates) => {
        setPaymentStatus(prev => ({ ...prev, ...updates }));
    };

    const storeVerificationState = (orderId, status, message) => {
        const state = { orderId, status, message };
        localStorage.setItem('paymentVerification', JSON.stringify(state));
    };

    const checkStoredVerification = () => {
        const stored = localStorage.getItem('paymentVerification');
        if (stored) {
            const { orderId, status, message } = JSON.parse(stored);
            updatePaymentStatus({ show: true, status, orderId, message });
            if (status === 'verifying') verifyPayment(orderId);
        }
    };

    const redirectToSuccessPage = () => {
        setTimeout(() => {
            const url = `/payment-success/?order_id=${paymentStatus.orderId}`;
            try {
                router.push(url);
            } catch (e) {
                window.location.href = url;
            }
        }, 1200);
    };

    const cleanupIntervals = () => {
        if (verificationInterval.current) clearInterval(verificationInterval.current);
        if (timerInterval.current) clearInterval(timerInterval.current);
    };

    const handleError = (message, error) => {
        console.error(message, error);
        updatePaymentStatus({
            show: true,
            status: "failed",
            message: message
        });
    };

    // UI Handlers
    const handlePaymentRedirect = () => {
        if (!uiState.paymentUrl) {
            updatePaymentStatus({
                show: true,
                status: "failed",
                message: "Payment link not ready"
            });
            return;
        }

        setLoading(prev => ({ ...prev, verification: true }));
        
        setTimeout(() => {
            window.open(uiState.paymentUrl, '_blank');
            verifyPayment(uiState.amount);
        }, 100);
    };

    const handleRetry = () => {
        cleanupIntervals();
        updatePaymentStatus({
            status: "verifying",
            message: "Retrying payment verification...",
            timer: VERIFICATION_TIMEOUT
        });
        verifyPayment(paymentStatus.orderId);
    };

    const handleCloseModal = () => {
        cleanupIntervals();
        
        if (paymentStatus.status !== 'success') {
            localStorage.removeItem('paymentVerification');
            localStorage.removeItem('paymentData');
        }
        
        updatePaymentStatus({ show: false });
    };

    // Render helpers
    const renderTimer = () => {
        const minutes = Math.floor(uiState.timeLeft / 60);
        const seconds = uiState.timeLeft % 60;
        return `${minutes}min ${seconds}sec`;
    };

    const renderLoader = () => (
        <div className="loader-container">
            <div className="spinner"></div>
            <p>Loading payment options...</p>
        </div>
    );

    const renderStatusModal = () => (
        <div className="status-modal-overlay">
            <div className="status-modal-content">
                {paymentStatus.status === "verifying" && (
                    <>
                        {renderLoader()}
                        <h4>Verifying Payment...</h4>
                        <p className="status-message">{paymentStatus.message}</p>
                        <button className="modal-button primary" onClick={handleCloseModal}>
                            Close
                        </button>
                    </>
                )}
                
                {paymentStatus.status === "success" && (
                    <>
                        <div className="status-icon success">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8 12.5l2.5 2.5 5-5" />
                            </svg>
                        </div>
                        <h4 className="status-title success">Payment Successful</h4>
                        <p className="status-message">{paymentStatus.message}</p>
                        <button className="modal-button primary" onClick={handleCloseModal}>
                            Close
                        </button>
                    </>
                )}
                
                {paymentStatus.status === "failed" && (
                    <>
                        <div className="status-icon error">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M15 9l-6 6M9 9l6 6" />
                            </svg>
                        </div>
                        <h4 className="status-title error">Payment Failed</h4>
                        <p className="status-message">{paymentStatus.message}</p>
                        <button className="modal-button primary" onClick={handleRetry}>
                            Retry
                        </button>
                        <button className="modal-button secondary" onClick={handleCloseModal}>
                            Close
                        </button>
                    </>
                )}
            </div>
            
            {paymentStatus.status === "verifying" && (
                <div className="verifying-timer">
                    Verifying payment... <span>{paymentStatus.timer}s</span>
                </div>
            )}
        </div>
    );

    const renderPaymentMethods = () => {
        if (!paymentData.products) return null;

        return (
            <div className="payment-methods">
                {paymentData.products.Gpay && (
                    <div 
                        className={`method-card ${uiState.activeTab === 2 ? 'selected' : ''}`}
                        onClick={() => setUiState(prev => ({ ...prev, activeTab: 2 }))}
                    >
                        <label className="method-label">
                            <svg className="method-icon" viewBox="15 -10 225 250">
                                {/* Google Pay SVG paths */}
                            </svg>
                            <span>Google Pay</span>
                        </label>
                    </div>
                )}
                
                {paymentData.products.Phonepe && (
                    <div 
                        className={`method-card ${uiState.activeTab === 3 ? 'selected' : ''}`}
                        onClick={() => setUiState(prev => ({ ...prev, activeTab: 3 }))}
                    >
                        <label className="method-label">
                            <svg className="method-icon" viewBox="0 0 700 700">
                                {/* PhonePe SVG paths */}
                            </svg>
                            <span>PhonePe</span>
                        </label>
                    </div>
                )}
                
                {/* Other payment methods */}
            </div>
        );
    };

    // Main render
    if (loading.initial || loading.upiLoading) {
        return (
            <div className="fullscreen-loader">
                {renderLoader()}
            </div>
        );
    }

    if (!paymentData.products) {
        return (
            <div className="error-container">
                <h4>Payment Error</h4>
                <p>Unable to load payment options. Please try again later.</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="payment-container">
            {loading.paymentInit && (
                <div className="overlay-loader">
                    {renderLoader()}
                    <p>Preparing payment link...</p>
                </div>
            )}
            
            {paymentData.qrCode && (
                <img src={paymentData.qrCode} alt="UPI QR Code" className="qr-code" />
            )}
            
            {paymentStatus.show && renderStatusModal()}

            <div className="header">
                <button className="back-button" onClick={() => router.push("/")}>
                    <svg width={19} height={16} viewBox="0 0 19 16">
                        <path d="M17.556 7.847H1M7.45 1L1 7.877l6.45 6.817" />
                    </svg>
                </button>
                <h4>Payments</h4>
            </div>
            
            <div className="payment-content">
                <div className="timer-container">
                    Offer ends in <span>{renderTimer()}</span>
                </div>
                
                {renderPaymentMethods()}

                <div className="price-details">
                    <h3>Price Details</h3>
                    <div className="price-item">
                        <span>Price (1 item)</span>
                        <span>₹ {router.query.id?.split('.')[1] || "0"}</span>
                    </div>
                    <div className="price-item">
                        <span>Delivery Charges</span>
                        <span className="free">FREE</span>
                    </div>
                    <div className="price-item total">
                        <span>Amount Payable</span>
                        <span>₹ {uiState.amount}</span>
                    </div>
                </div>
            </div>
            
            <div className="payment-footer">
                <div className="price-display">
                    <span>₹ {uiState.amount}</span>
                </div>
                
                <button
                    onClick={handlePaymentRedirect}
                    className="pay-button"
                    disabled={loading.verification || loading.paymentInit}
                >
                    {loading.verification ? (
                        <>
                            <Loader2 className="button-spinner" />
                            Processing...
                        </>
                    ) : "Continue"}
                </button>
            </div>
        </div>
    );
};

export default Payments;