import { useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import { ProductLandingView } from './components/ProductLandingView';
import OrderLookupView from './components/views/OrderLookupView';
import LandingView from './components/views/LandingView';
import LoginView from './components/views/LoginView';
import ConvertView from './components/views/ConvertView';
import OrdersView from './components/views/OrdersView';
import WithdrawView from './components/views/WithdrawView';
import AccountView from './components/views/AccountView';
import AdminView from './components/dashboard/AdminView';
import UserNavbar from './components/common/UserNavbar';
import FloatingZaloContact from './components/common/FloatingZaloContact';
import MobileBottomNav from './components/common/MobileBottomNav';
import ToastNotification from './components/common/ToastNotification';

const API_URL_ROOT = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

function App() {
  const { view, setView } = useApp();

  // 1. Short-link redirect handler (/s/code)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/s/')) {
      const code = path.split('/s/')[1]?.split('?')[0]?.trim();
      if (code) {
        fetch(`${API_URL_ROOT}/api/public/short-link/${code}`)
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.data) {
              window.location.replace(resData.data);
            } else {
              window.location.replace('https://28symues.store/lookup');
            }
          })
          .catch(() => {
            window.location.replace('https://28symues.store/lookup');
          });
      }
    }
  }, []);

  // 2. Product Landing Code (/p/code)
  const [productCode, setProductCode] = useState(() => {
    try {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path.includes('/p/')) {
        return path.split('/p/')[1]?.split('?')[0]?.trim();
      }
      return params.get('p') || params.get('code') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const pCode = path.includes('/p/') 
      ? path.split('/p/')[1]?.split('?')[0]?.split('#')[0]?.split('/')[0]?.trim() 
      : (params.get('p') || params.get('code'));
    if (pCode) {
      setProductCode(pCode);
    }
  }, []);

  // View Routing:
  if (productCode || view === 'product_landing') {
    return <ProductLandingView code={productCode} apiRoot={API_URL_ROOT} />;
  }

  if (view === 'lookup') {
    return (
      <>
        <ToastNotification />
        <OrderLookupView setView={setView} />
        <FloatingZaloContact />
      </>
    );
  }

  if (view === 'login') {
    return <LoginView />;
  }

  if (view === 'convert') {
    return (
      <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-main)', paddingBottom: '90px' }}>
        <ToastNotification />
        <UserNavbar />
        <main>
          <ConvertView />
        </main>
        <FloatingZaloContact />
        <MobileBottomNav />
      </div>
    );
  }

  if (view === 'orders') {
    return (
      <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-main)', paddingBottom: '90px' }}>
        <ToastNotification />
        <UserNavbar />
        <main>
          <OrdersView />
        </main>
        <FloatingZaloContact />
        <MobileBottomNav />
      </div>
    );
  }

  if (view === 'withdraw') {
    return (
      <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-main)', paddingBottom: '90px' }}>
        <ToastNotification />
        <UserNavbar />
        <main>
          <WithdrawView />
        </main>
        <FloatingZaloContact />
        <MobileBottomNav />
      </div>
    );
  }

  if (view === 'account') {
    return (
      <div style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-main)', paddingBottom: '90px' }}>
        <ToastNotification />
        <UserNavbar />
        <main>
          <AccountView />
        </main>
        <FloatingZaloContact />
        <MobileBottomNav />
      </div>
    );
  }

  if (view === 'admin') {
    return <AdminView />;
  }

  // Default: Landing Page
  return (
    <>
      <LandingView />
      <FloatingZaloContact />
    </>
  );
}

export default App;
