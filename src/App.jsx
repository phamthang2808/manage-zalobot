import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AdminView from './components/dashboard/AdminView';
import LandingView from './components/views/LandingView';
import LoginView from './components/views/LoginView';
import OrderLookupView from './components/views/OrderLookupView';
import SplashScreen from './components/common/SplashScreen';

function AppRouter() {
  const { view } = useApp();

  if (view === 'lookup') {
    return <OrderLookupView />;
  }

  if (view === 'login') {
    return <LoginView />;
  }

  if (view === 'admin') {
    return <AdminView />;
  }

  return <LandingView />;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      // Chỉ hiển thị Splash Screen ĐÚNG 1 LẦN duy nhất khi mở trang web lần đầu tiên
      const hasSeen = sessionStorage.getItem('hasSeenSplash');
      const isLoginOrAdmin = window.location.pathname.includes('/login') ||
                             window.location.search.includes('view=login') ||
                             window.location.search.includes('view=admin');
      if (hasSeen || isLoginOrAdmin) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  const handleSplashFinish = () => {
    try {
      sessionStorage.setItem('hasSeenSplash', 'true');
    } catch { /* ignore */ }
    setShowSplash(false);
  };

  return (
    <AppProvider>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <AppRouter />
    </AppProvider>
  );
}
