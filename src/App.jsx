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
import UserSidebar from './components/common/UserSidebar';
import WorkspaceTopBar from './components/common/WorkspaceTopBar';
import FloatingZaloContact from './components/common/FloatingZaloContact';
import MobileBottomNav from './components/common/MobileBottomNav';
import ToastNotification from './components/common/ToastNotification';

const API_URL_ROOT = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

function App() {
  const { view, setView } = useApp();
  const [userSidebarOpen, setUserSidebarOpen] = useState(false);

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

  if (view === 'login') {
    return <LoginView />;
  }

  if (view === 'admin') {
    return <AdminView />;
  }

  // Unified Workspace Layout for HOME, LOOKUP and ALL MEMBER TOOLS:
  // Vừa có Sidebar bên trái, vừa có đầy đủ các tab thanh ngang trên!
  const isHomePage = view === 'home' || view === 'landing';

  return (
    <div className="user-workspace-layout" style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-main)' }}>
      <ToastNotification />
      <UserSidebar sidebarOpen={userSidebarOpen} setSidebarOpen={setUserSidebarOpen} />
      <div className="user-workspace-content">
        <WorkspaceTopBar setSidebarOpen={setUserSidebarOpen} />
        <main style={{
          flex: 1,
          padding: isHomePage ? '0' : '24px 20px 80px',
          maxWidth: isHomePage ? '100%' : '1200px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          {isHomePage && <LandingView inWorkspace={true} />}
          {view === 'convert' && <ConvertView />}
          {view === 'orders' && <OrdersView />}
          {view === 'withdraw' && <WithdrawView />}
          {view === 'account' && <AccountView />}
          {view === 'lookup' && <OrderLookupView setView={setView} />}
        </main>
      </div>
      <FloatingZaloContact />
      <MobileBottomNav />
    </div>
  );
}

export default App;
