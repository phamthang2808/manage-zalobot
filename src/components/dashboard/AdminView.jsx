import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import OverviewTab from './OverviewTab';
import UsersTab from './UsersTab';
import OrdersTab from './OrdersTab';
import PayoutsTab from './PayoutsTab';
import MobileBottomNav from '../common/MobileBottomNav';
import ToastNotification from '../common/ToastNotification';

export default function AdminView() {
  const { activeTab, loading, error, fetchData, token, user } = useApp();

  return (
    <div className="app-container">
      <ToastNotification />
      <Sidebar />
      <main className="main-content">
        <DashboardHeader activeTab={activeTab} fetchData={fetchData} />
        <section className="content-body">
          {error && (
            <div style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid var(--color-danger)',
              color: 'var(--color-danger)',
              padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: '500'
            }}>
              ⚠️ Lỗi: {error}. Vui lòng kiểm tra backend server đang chạy ở cổng 8080!
            </div>
          )}
          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <OverviewTab />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'payouts' && <PayoutsTab />}
            </>
          )}
        </section>
      </main>
      <MobileBottomNav />
    </div>
  );
}
