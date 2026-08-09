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
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AppProvider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <AppRouter />
    </AppProvider>
  );
}
