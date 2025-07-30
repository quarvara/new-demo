import '../styles/Home.module.css'
import '../styles/globals.css'
import '../styles/PaymentConfirmation.css';
import "bootstrap/dist/css/bootstrap.min.css"; // Import bootstrap CSS
import { ToastProvider } from 'react-toast-notifications';
import Layout from '@/componets/Layout';
import { useEffect, useState } from 'react';


function MyApp({ Component, pageProps }) {
  const [products1, setProducts1] = useState({ pixelId: "" });

  useEffect(() => {
    fetchProducts1();
  }, []);
  const fetchProducts1 = async () => {
    try {
      let headersList = {
        "Accept": "*/*",
        "User-Agent": "Thunder Client (https://www.thunderclient.com)",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      };

      const response = await fetch('/api/upichange', {
        method: 'GET',
        headers: headersList,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("upi", data.upi.upi)
        setProducts1(data.pixelId);
      } else {
      }
    } catch (error) {
    }

  };
  return (
    <ToastProvider>
      <Layout data={products1}>
        <Component {...pageProps} />
      </Layout>
    </ToastProvider>
  );
}

export default MyApp;
