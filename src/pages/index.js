import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePaymentClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/initiate-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (data?.data?.url) {
        window.open(data.data.url, '_blank');
      } else {
        setError('No payment URL received. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong while initiating payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <div className="card shadow-sm">
        <h1 className="title">👋 Welcome to <span className="brand">PayPortal</span></h1>
        <p className="subtitle">A simple way to collect payments instantly via UPI.</p>

        <button
          onClick={handlePaymentClick}
          className="pay-btn"
          disabled={loading}
        >
          {loading ? 'Processing Payment...' : '💸 Pay ₹100 Now'}
        </button>

        {error && <div className="error">{error}</div>}
      </div>

      <style jsx>{`
        .wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(to right, #eef9ff, #e1f5fe);
          font-family: 'Segoe UI', sans-serif;
        }

        .card {
          background: #fff;
          padding: 2.5rem 2rem;
          border-radius: 1rem;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .title {
          font-size: 2rem;
          font-weight: 600;
          color: #222;
          margin-bottom: 0.5rem;
        }

        .brand {
          color: #0d6efd;
        }

        .subtitle {
          color: #555;
          font-size: 1rem;
          margin-bottom: 2rem;
        }

        .pay-btn {
          background-color: #28a745;
          color: white;
          border: none;
          font-size: 1.1rem;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s ease, transform 0.2s ease;
          font-weight: 600;
        }

        .pay-btn:disabled {
          background-color: #a5d6a7;
          cursor: not-allowed;
        }

        .pay-btn:hover:not(:disabled) {
          background-color: #218838;
          transform: scale(1.05);
        }

        .error {
          margin-top: 1.5rem;
          color: #dc3545;
          font-weight: 500;
        }

        @media (max-width: 500px) {
          .card {
            padding: 2rem 1.25rem;
          }

          .title {
            font-size: 1.6rem;
          }

          .subtitle {
            font-size: 0.95rem;
          }

          .pay-btn {
            font-size: 1rem;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
