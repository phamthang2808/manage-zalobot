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
import BlogView from './components/views/BlogView';
import AdminView from './components/dashboard/AdminView';
import UserSidebar from './components/common/UserSidebar';
import WorkspaceTopBar from './components/common/WorkspaceTopBar';
import FloatingZaloContact from './components/common/FloatingZaloContact';
import MobileBottomNav from './components/common/MobileBottomNav';
import ToastNotification from './components/common/ToastNotification';
import ConfirmModal from './components/common/ConfirmModal';
import AnnouncementModal from './components/common/AnnouncementModal';
import ReferralPromptModal from './components/common/ReferralPromptModal';

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
              window.location.replace('https://28symues.store/?view=lookup');
            }
          })
          .catch(() => {
            window.location.replace('https://28symues.store/?view=lookup');
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

  // 3. Tự động bắt mã giới thiệu (?ref=...) từ URL và lưu vào localStorage cho khách mới
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref && ref.trim()) {
        const cleanRef = ref.trim().replace(/^GT/i, '');
        localStorage.setItem('pendingReferralCode', cleanRef);
      }
    } catch (e) {}
  }, []);

  // Nếu đang ở luồng link rút gọn /s/code, render màn hình loading tối giản chờ redirect, tránh chớp nháy giao diện Workspace
  const isShortLink = typeof window !== 'undefined' && window.location.pathname.includes('/s/');
  if (isShortLink) {
    return (
      <div style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fffaf5',
        color: '#ea580c',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '4px solid #ffedd5',
          borderTopColor: '#ea580c',
          borderRadius: '50%',
          animation: 'symShortSpin 0.75s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ fontWeight: '800', fontSize: '15px', color: '#ea580c', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
          28SYMUES AFFILIATE
        </p>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Đang chuyển hướng đến liên kết tiếp thị...
        </p>
        <style>{`@keyframes symShortSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // View Routing:
  if (productCode || view === 'product_landing') {
    return <ProductLandingView code={productCode} apiRoot={API_URL_ROOT} />;
  }

  if (view === 'login') {
    return <LoginView />;
  }

  if (view === 'admin') {
    return (
      <>
        <ToastNotification />
        <ConfirmModal />
        <AdminView />
      </>
    );
  }

  // Unified Workspace Layout for HOME, LOOKUP and ALL MEMBER TOOLS:
  // Vừa có Sidebar bên trái, vừa có đầy đủ các tab thanh ngang trên!
  const isHomePage = view === 'home' || view === 'landing';

  return (
    <div className="user-workspace-layout" style={{ minHeight: '100vh', minHeight: '100dvh', background: 'var(--bg-main)' }}>
      <ToastNotification />
      <ConfirmModal />
      <AnnouncementModal apiRoot={API_URL_ROOT} />
      <ReferralPromptModal />
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
          {view === 'blog' && <BlogView />}
          {view === 'lookup' && <OrderLookupView setView={setView} />}
        </main>
      </div>
      <FloatingZaloContact />
      <MobileBottomNav />
    </div>
  );
}

export default App;
