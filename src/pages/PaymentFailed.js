import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

const PaymentFailed = () => {
  const [loading, setLoading] = useState(true); // State to handle loading spinner
  const router = useRouter();
  const { transactionId, amount,amount1, status, date } = router.query;

  useEffect(() => {
    // Simulate a 5-second loading period
    const timer = setTimeout(() => {
      setLoading(false); // After 5 seconds, set loading to false
    }, 5000);

    // Cleanup the timer if the component is unmounted before the time ends
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    // Render the loading spinner while loading is true
    return (
      <div className="loading-spinner">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="50"
          height="50"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid"
          className="lds-spinner"
        >
          <circle
            cx="50"
            cy="50"
            fill="none"
            stroke="#333"
            strokeWidth="10"
            r="35"
            strokeDasharray="164.93361431346415 56.97787143782138"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              repeatCount="indefinite"
              dur="1s"
              values="0 50 50;360 50 50"
              keyTimes="0;1"
            />
          </circle>
        </svg>
      </div>
    );
  }

  // Render the payment failed message once loading is complete
  return (
    <div className="confirmation-container">
      <div className="confirmation-box">
        <svg
          className="ft-red-cross"
          xmlns="http://www.w3.org/2000/svg"
          height="100"
          width="100"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <circle className="circle" fill="#ff0000" cx="24" cy="24" r="22" />
          <path
            className="cross"
            fill="none"
            stroke="#FFF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            d="M16 16L32 32M32 16L16 32"
          />
        </svg>
        <p className="confirmation-message py-3">
          We regret to inform you that your payment has failed. Please try again.
        </p>
        <div className="transaction-details">
          <p><strong>Transaction ID:</strong> {transactionId}</p>
          <p><strong>Amount:</strong> ₹{amount}</p>
          <p><strong>Paid Status:</strong> {status}</p>
          <p><strong>Date:</strong> {date}</p>
        </div>
        <a href={`/payment/${amount}.${amount1}`} className="confirmation-button btn btn-danger">Try again</a>
      </div>
    </div>
  );
};

export default PaymentFailed;
