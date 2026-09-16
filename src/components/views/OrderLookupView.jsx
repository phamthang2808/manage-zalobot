import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import MobileBottomNav from '../common/MobileBottomNav';
import ToastNotification from '../common/ToastNotification';
import ThemeToggle from '../common/ThemeToggle';
import RunningCatMascot from '../common/RunningCatMascot';

export default function OrderLookupView() {

  const { view, setView, theme, showToast, API_URL_ROOT, windowWidth } = useApp();

  // Search state
  const [lookupSearchType, setLookupSearchType] = useState('ORDER_ID');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupStartDate, setLookupStartDate] = useState('');
  const [lookupEndDate, setLookupEndDate] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupRecentSearches, setLookupRecentSearches] = useState(() => {
    try { const s = localStorage.getItem('recentLookups'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [lookupLocalFilter, setLookupLocalFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [showBanner, setShowBanner] = useState(true);

  // Bank info state
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [bankSaveError, setBankSaveError] = useState('');
  const [bankSaveLoading, setBankSaveLoading] = useState(false);

  // Payout state
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutSaveError, setPayoutSaveError] = useState('');
  const [payoutSaveLoading, setPayoutSaveLoading] = useState(false);

  // OTP state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpActionType, setOtpActionType] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  // Auto lookup from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlQuery = urlToken || params.get('query') || params.get('q') || params.get('orderId') || params.get('zaloId');
    const urlStartDate = params.get('startDate');
    const urlEndDate = params.get('endDate');
    if (urlQuery) {
      setLookupQuery(urlQuery);
      setLookupSearchType('ORDER_ID');
      if (urlStartDate) setLookupStartDate(urlStartDate);
      if (urlEndDate) setLookupEndDate(urlEndDate);
      handlePublicLookup(urlQuery, 'ORDER_ID');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublicLookup = async (overrideQuery = null, overrideType = null) => {
    const q = overrideQuery !== null ? overrideQuery : lookupQuery;
    const type = overrideType !== null ? overrideType : lookupSearchType;
    if (overrideType !== null) setLookupSearchType(overrideType);
    if (!q || !q.trim()) {
      setLookupError('Vui lòng nhập từ khóa tìm kiếm');
      showToast('Vui lòng nhập từ khóa tìm kiếm', 'error');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      let url = `${API_URL_ROOT}/api/public/lookup?searchType=${type}&query=${encodeURIComponent(q.trim())}`;
      if (lookupStartDate) url += `&startDate=${lookupStartDate}`;
      if (lookupEndDate) url += `&endDate=${lookupEndDate}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi tra cứu thông tin');
      setLookupResult(json.data);
      if (type === 'ORDER_ID') {
        setLookupRecentSearches(prev => {
          const item = { query: q.trim(), searchType: type };
          const filtered = prev.filter(x => !(x.query.toLowerCase() === item.query.toLowerCase() && x.searchType === item.searchType));
          const updated = [item, ...filtered].slice(0, 5);
          localStorage.setItem('recentLookups', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      setLookupError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  const removeRecentSearch = (e, index) => {
    e.stopPropagation();
    setLookupRecentSearches(prev => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem('recentLookups', JSON.stringify(updated));
      return updated;
    });
  };

  const sendOtpToUser = async (action) => {
    if (otpCountdown > 0) { showToast(`Vui lòng đợi ${otpCountdown} giây trước khi yêu cầu gửi lại mã OTP mới!`, 'warning'); return; }
    if (action === 'BANK') {
      if (!editBankName.trim() || !editAccountNumber.trim()) { setBankSaveError('Vui lòng điền đầy đủ tên ngân hàng và số tài khoản'); return; }
    } else if (action === 'PAYOUT') {
      const amountVal = parseFloat(payoutAmount.replace(/[^\d]/g, ''));
      if (isNaN(amountVal) || amountVal <= 0) { setPayoutSaveError('Vui lòng nhập số tiền rút hợp lệ (lớn hơn 0đ)'); return; }
      if (!lookupResult.bankName || !lookupResult.accountNumber) { setPayoutSaveError('Vui lòng thiết lập thông tin ngân hàng nhận tiền trước'); return; }
    }
    setOtpSending(true); setOtpError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zaloId: lookupResult.zaloId, zaloName: lookupResult.zaloName || 'Sếp' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi gửi mã OTP');
      setOtpActionType(action); setOtpCode(''); setOtpModalOpen(true); setOtpCountdown(60);
      showToast('Đã gửi mã xác thực OTP vào tin nhắn riêng Zalo!', 'success');
    } catch (err) { showToast(err.message, 'error'); } finally { setOtpSending(false); }
  };

  const handleSaveBankInfo = async (code = '') => {
    if (!editBankName.trim() || !editAccountNumber.trim()) { setBankSaveError('Vui lòng điền đầy đủ tên ngân hàng và số tài khoản'); showToast('Vui lòng điền đầy đủ thông tin', 'error'); return; }
    setBankSaveLoading(true); setBankSaveError(''); setOtpError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/bank-info`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zaloId: lookupResult.zaloId, bankName: editBankName.trim(), accountNumber: editAccountNumber.trim(), otp: code })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi lưu thông tin ngân hàng');
      setLookupResult(prev => ({ ...prev, bankName: editBankName.trim(), accountNumber: editAccountNumber.trim() }));
      setIsEditingBank(false); setOtpModalOpen(false); setOtpCountdown(0);
      showToast('Đã cập nhật thông tin ngân hàng thành công!', 'success');
    } catch (err) {
      setBankSaveError(err.message);
      if (otpModalOpen) setOtpError(err.message);
      showToast(err.message, 'error');
    } finally { setBankSaveLoading(false); }
  };

  const handleRequestPayout = async (code = '') => {
    const amountVal = parseFloat(payoutAmount.replace(/[^\d]/g, ''));
    if (isNaN(amountVal) || amountVal <= 0) { setPayoutSaveError('Vui lòng nhập số tiền rút hợp lệ (lớn hơn 0đ)'); showToast('Vui lòng nhập số tiền rút hợp lệ (lớn hơn 0đ)', 'error'); return; }
    if (!lookupResult.bankName || !lookupResult.accountNumber) { setPayoutSaveError('Vui lòng thiết lập thông tin ngân hàng nhận tiền trước'); showToast('Vui lòng thiết lập thông tin ngân hàng nhận tiền trước', 'error'); return; }
    setPayoutSaveLoading(true); setPayoutSaveError(''); setOtpError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/payout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zaloId: lookupResult.zaloId, amount: amountVal, otp: code })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi yêu cầu rút tiền');
      setPayoutAmount(''); setOtpModalOpen(false); setOtpCountdown(0);
      showToast('🎉 Yêu cầu rút tiền thành công! Trưởng nhóm Phạm Thắng sẽ duyệt và chuyển khoản cho sếp sớm nhất!', 'success');
      handlePublicLookup(lookupResult.zaloId, 'ZALO_ID');
    } catch (err) {
      setPayoutSaveError(err.message);
      if (otpModalOpen) setOtpError(err.message);
      showToast(err.message, 'error');
    } finally { setPayoutSaveLoading(false); }
  };

  const totalCommission = lookupResult ? (lookupResult.wallet.completedCommission + lookupResult.wallet.pendingCommission) : 0;
  const searchedOrders = lookupResult
    ? lookupResult.orders.filter(o => {
        const matchesQuery = o.orderId?.toLowerCase().includes(lookupLocalFilter.toLowerCase()) || o.productName?.toLowerCase().includes(lookupLocalFilter.toLowerCase());
        const matchesPlatform = platformFilter === 'ALL' || o.platform === platformFilter || (platformFilter === 'Shopee' && (!o.platform || o.platform === 'Shopee'));
        return matchesQuery && matchesPlatform;
      })
    : [];

  return (
    <div className="lookup-page-container">
      <RunningCatMascot />
      <style dangerouslySetInnerHTML={{__html: `

        .lookup-page-container { min-height: 100vh; width: 100%; background: var(--bg-main); color: var(--text-main); font-family: 'Inter', system-ui, sans-serif; padding: 16px; display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; }
        .lookup-page-container::before { content: ''; position: absolute; top: -15%; left: -10%; width: 700px; height: 700px; background: radial-gradient(circle, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.03) 40%, transparent 70%); z-index: 1; pointer-events: none; animation: lookupFloatOrb1 8s ease-in-out infinite; }
        .lookup-page-container::after { content: ''; position: absolute; bottom: -20%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, rgba(234,88,12,0.02) 40%, transparent 70%); z-index: 1; pointer-events: none; animation: lookupFloatOrb2 10s ease-in-out infinite; }
        @keyframes lookupFloatOrb1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.1); } }
        @keyframes lookupFloatOrb2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-40px) scale(1.05); } }
        .lookup-card, .lookup-card * { box-sizing: border-box !important; }
        .lookup-header, .lookup-card, .stats-container, .orders-container, .lookup-error { position: relative; z-index: 2; }
        .lookup-header { width: 100%; max-width: 600px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); }
        .lookup-logo { font-size: 18px; font-weight: 800; color: var(--text-bright); display: flex; align-items: center; gap: 8px; }
        .lookup-logo img { border: 1px solid var(--border-color); }
        .lookup-admin-link { font-size: 13px; color: var(--text-bright); text-decoration: none; background: var(--bg-card); padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--border-color); font-weight: 700; transition: all 0.2s ease; cursor: pointer; }
        .lookup-admin-link:hover { background: #fff7ed; color: #ea580c; border-color: #f97316; }
        .lookup-card { width: 100%; max-width: 600px; box-sizing: border-box !important; background: var(--bg-card); border: 1.5px solid var(--border-color); backdrop-filter: blur(16px); border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.1); margin-bottom: 24px; overflow: hidden; }
        .lookup-title { font-size: 22px; font-weight: 800; text-align: center; color: var(--text-bright); margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .lookup-subtitle { font-size: 13.5px; color: var(--text-muted); font-weight: 600; text-align: center; margin-bottom: 24px; }
        .lookup-tabs { display: flex; background: var(--bg-main); border: 1.5px solid var(--border-color); padding: 3px; border-radius: 10px; margin-bottom: 16px; gap: 2px; width: 100%; box-sizing: border-box; }
        .lookup-tab { flex: 1; min-width: 0; text-align: center; padding: 8px 4px; font-size: 12px; font-weight: 700; border-radius: 7px; cursor: pointer; background: transparent; border: none; color: var(--text-muted); transition: all 0.2s ease; white-space: nowrap; }
        @media (max-width: 480px) { .lookup-tab { font-size: 11.5px; padding: 7px 2px; } }
        .lookup-tab:hover { color: var(--text-bright); }
        .lookup-tab.active { background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff !important; box-shadow: 0 4px 14px rgba(249,115,22,0.35); }
        .lookup-input-group { margin-bottom: 16px; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
        .lookup-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-bright); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .lookup-input { width: 100% !important; min-width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; background: var(--bg-main); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 12px 14px; color: var(--text-bright); font-size: 15px; font-weight: 600; outline: none; transition: all 0.2s ease; display: block !important; -webkit-appearance: none; appearance: none; }
        input[type="date"].lookup-input { width: 100% !important; min-width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; display: block !important; }
        .lookup-input:focus { border-color: #ea580c; background: var(--bg-card); box-shadow: 0 0 12px rgba(249,115,22,0.25); }
        .lookup-date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
        @media (max-width: 768px) { .lookup-date-grid { display: flex !important; flex-direction: column !important; gap: 16px !important; } }
        .lookup-btn { width: 100%; max-width: 100% !important; box-sizing: border-box !important; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; font-size: 15px; font-weight: 800; border: none; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(249,115,22,0.35); }
        .lookup-btn:hover { box-shadow: 0 6px 20px rgba(249,115,22,0.5); transform: translateY(-1px); }
        .lookup-btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }
        .recent-searches { margin-top: 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-main); font-weight: 600; }
        .recent-tag { background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 12px; padding: 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; color: var(--text-bright); font-weight: 700; }
        .recent-tag:hover { border-color: #ea580c; background: #fff7ed; color: #ea580c; }
        .recent-close { font-size: 12px; color: #dc2626; font-weight: bold; }
        .lookup-error { width: 100%; max-width: 600px; background: var(--bg-main); border: 1.5px solid #f87171; color: #991b1b; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; font-weight: 700; }
        .stats-container { width: 100%; max-width: 600px; margin-bottom: 24px; }
        .stats-section-title { font-size: 17px; font-weight: 800; margin-bottom: 12px; color: var(--text-bright); display: flex; align-items: center; gap: 8px; }
        .stats-cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .stats-cards-grid > :first-child { grid-column: span 2; }
        .stat-card-item { border-radius: 12px; padding: 16px; border: 1.5px solid var(--border-color); display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(0,0,0,0.04); background: var(--bg-card); }
        .stat-card-item.total { background: linear-gradient(135deg, rgba(255,237,213,0.5) 0%, var(--bg-card) 100%); border-color: #fdba74; }
        .stat-card-item.pending { background: linear-gradient(135deg, rgba(254,243,199,0.5) 0%, var(--bg-card) 100%); border-color: #fcd34d; }
        .stat-card-item.completed { background: linear-gradient(135deg, rgba(209,250,229,0.5) 0%, var(--bg-card) 100%); border-color: #6ee7b7; }
        .stat-card-item.withdrawable { background: linear-gradient(135deg, rgba(255,237,213,0.5) 0%, var(--bg-card) 100%); border-color: #fdba74; }
        .stat-card-item.received { background: linear-gradient(135deg, rgba(220,252,231,0.5) 0%, var(--bg-card) 100%); border-color: #86efac; }
        .stat-card-label { font-size: 11.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; font-weight: 700; letter-spacing: 0.5px; }
        .stat-card-value { font-size: 24px; font-weight: 900; color: var(--text-bright); }
        .stat-card-value.primary { color: #c2410c; }
        .orders-container { width: 100%; max-width: 600px; }
        .order-card-item { background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
        .order-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12.5px; color: var(--text-muted); font-weight: 600; }
        .order-id-badge { font-family: monospace; font-weight: 800; color: #c2410c; font-size: 13px; }
        .order-card-title { font-size: 14.5px; font-weight: 700; color: var(--text-bright); margin-bottom: 10px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .order-card-commission-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 10px; }
        .order-commission-label { font-size: 12.5px; color: var(--text-muted); font-weight: 600; }
        .order-commission-val { font-size: 16px; font-weight: 800; color: #047857; }
        .lookup-spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: lookup-spin 1s linear infinite; }
        @keyframes lookup-spin { to { transform: rotate(360deg); } }
        .lookup-banner-section { position: relative; width: 100%; max-width: 600px; margin: 32px 0 8px; display: flex; flex-direction: column; align-items: center; z-index: 2; }
        .lookup-banner-img-wrap { position: relative; width: 260px; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 0 20px rgba(249,115,22,0.15); border: 2px solid #fed7aa; animation: banner-float 4s ease-in-out infinite; }
        .lookup-banner-img-wrap img { width: 100%; display: block; }
        .lookup-banner-close { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        @keyframes banner-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @media (max-width: 480px) { .stats-cards-grid { grid-template-columns: 1fr; } .stats-cards-grid > :first-child { grid-column: span 1; } .lookup-card { padding: 16px; } .stat-card-value { font-size: 20px; } .lookup-banner-img-wrap { width: 100%; max-width: 280px; } }
      `}} />

      <ToastNotification />

      {/* Header */}
      <div className="lookup-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', flexWrap: 'nowrap', gap: '6px', boxSizing: 'border-box' }}>
        <div className="lookup-logo" onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }} style={{ display: 'flex', alignItems: 'center', flexShrink: 1, minWidth: 0, cursor: 'pointer' }}>
<<<<<<< HEAD
          <img src="/28symueslogomanin.png?v=7" alt="28Symues Affiliate Logo" style={{ height: '76px', width: 'auto', maxWidth: '380px', flexShrink: 0, objectFit: 'contain' }} />
=======
<<<<<<< HEAD
          <img src="/28symueslogomanin.png?v=6" alt="28Symues Affiliate Logo" style={{ height: '64px', width: 'auto', maxWidth: '300px', flexShrink: 0, objectFit: 'contain' }} />
=======
          <img src="/28symueslogomanin.png?v=5" alt="28Symues Affiliate Logo" style={{ height: '44px', width: 'auto', maxWidth: '220px', flexShrink: 0, objectFit: 'contain' }} />
>>>>>>> 7845dd0ea1ec830089052126cfbb6d1a3552cf82
>>>>>>> f5ce3a09b6d019ebf66c6d1efa5ffe75cca4664d
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <ThemeToggle />
          <button 
            className="lookup-admin-link" 
            onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }} 
            style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, cursor: 'pointer' }}
          >
            <i className="fa-solid fa-house" style={{ color: '#ea580c', flexShrink: 0 }}></i>
            <span style={{ whiteSpace: 'nowrap', display: 'inline' }}>Trang chủ</span>
          </button>
        </div>
      </div>

      {/* Search Panel */}
      <div className="lookup-card">
        <h2 className="lookup-title">
          <i className="fa-thin fa-magnifying-glass" style={{ marginRight: '8px' }}></i> Tra Cứu Đơn Hàng Shopee & TikTok Shop
        </h2>
        <p className="lookup-subtitle">Nhập mã đơn hàng Shopee hoặc TikTok Shop để kiểm tra trạng thái và hoa hồng</p>

        <div className="lookup-input-group">
          <label className="lookup-label">Mã đơn hàng (Shopee / TikTok Shop)</label>
          <input type="text" className="lookup-input" value={lookupQuery} onChange={e => setLookupQuery(e.target.value)}
            placeholder="Ví dụ: 260606C8W7YARK (Shopee) hoặc 585592697583797863 (TikTok)..."
            onKeyDown={e => e.key === 'Enter' && handlePublicLookup(null, 'ORDER_ID')} />
        </div>

        <button className="lookup-btn" onClick={() => handlePublicLookup(null, 'ORDER_ID')} disabled={lookupLoading}>
          {lookupLoading ? (<><div className="lookup-spinner"></div>Đang tìm kiếm...</>) : 'Tra cứu đơn hàng'}
        </button>

        {lookupRecentSearches.length > 0 && (
          <div className="recent-searches">
            <span>Lịch sử tra cứu:</span>
            {lookupRecentSearches.map((item, idx) => (
              <div key={idx} className="recent-tag" onClick={() => { setLookupQuery(item.query); handlePublicLookup(item.query, 'ORDER_ID'); }}>
                <span>🛒 {item.query.length > 18 ? item.query.substring(0, 18) + '...' : item.query}</span>
                <span className="recent-close" onClick={e => removeRecentSearch(e, idx)}>&times;</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {lookupError && <div className="lookup-error">⚠️ {lookupError}</div>}

      {/* Results */}
      {lookupResult && (
        <>
          {/* Bank Info */}
          <div className="lookup-card" style={{ marginBottom: '24px' }}>
            <h3 className="stats-section-title bank-card-header-title">
              <span className="bank-card-title-text">🏦 Thông Tin Ngân Hàng Nhận Tiền</span>
              {!isEditingBank && (
                <button className="bank-edit-btn"
                  onClick={() => { setEditBankName(lookupResult.bankName || ''); setEditAccountNumber(lookupResult.accountNumber || ''); setBankSaveError(''); setIsEditingBank(true); }}>
                  <i className="fa-regular fa-pen-to-square" style={{ fontSize: '12px' }}></i>
                  <span>{lookupResult.bankName ? 'Sửa' : 'Cài đặt'}</span>
                </button>
              )}
            </h3>
            {isEditingBank ? (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="lookup-date-grid" style={{ marginBottom: '4px' }}>
                  <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                    <label className="lookup-label">Tên Ngân Hàng</label>
                    <input type="text" className="lookup-input" placeholder="Ví dụ: MB, Techcombank..." value={editBankName} onChange={e => setEditBankName(e.target.value)} />
                  </div>
                  <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                    <label className="lookup-label">Số Tài Khoản</label>
                    <input type="text" className="lookup-input" placeholder="Số tài khoản..." value={editAccountNumber} onChange={e => setEditAccountNumber(e.target.value)} />
                  </div>
                </div>
                {bankSaveError && <div style={{ color: '#ef4444', fontSize: '12px' }}>⚠️ {bankSaveError}</div>}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button className="lookup-admin-link" style={{ padding: '6px 14px', background: 'var(--bg-main)', color: 'var(--text-muted)' }} onClick={() => setIsEditingBank(false)} disabled={bankSaveLoading}>Hủy</button>
                  <button className="lookup-btn" style={{ width: 'auto', padding: '6px 16px', fontSize: '13px' }} onClick={() => sendOtpToUser('BANK')} disabled={bankSaveLoading}>
                    {bankSaveLoading ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bank-info-display-box">
                <div>
                  <span className="bank-info-label">NGÂN HÀNG</span>
                  <strong className="bank-info-val">{lookupResult.bankName || 'Chưa thiết lập'}</strong>
                </div>
                <div>
                  <span className="bank-info-label">SỐ TÀI KHOẢN</span>
                  <strong className="bank-info-val">{lookupResult.accountNumber || 'Chưa thiết lập'}</strong>
                </div>
              </div>
            )}
          </div>

              {/* Wallet Stats */}
              <div className="stats-container">
                <h3 className="stats-section-title">💰 Thống Kê Hoa Hồng của: <span style={{ color: '#ea580c' }}>{lookupResult.zaloName}</span></h3>
                <div className="stats-cards-grid">
                  <div className="stat-card-item total">
                    <span className="stat-card-label">Tổng tích lũy (Hoàn thành + Chờ)</span>
                    <span className="stat-card-value primary">{formatMoney(totalCommission)}</span>
                  </div>
                  <div className="stat-card-item pending">
                    <span className="stat-card-label">Đang chờ xử lý</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Đang vận chuyển hoặc chưa xác nhận</span>
                    <span className="stat-card-value">{formatMoney(lookupResult.wallet.pendingCommission)}</span>
                  </div>
                  <div className="stat-card-item completed">
                    <span className="stat-card-label">Đã hoàn thành</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Đã ấn giao hàng thành công</span>
                    <span className="stat-card-value">{formatMoney(lookupResult.wallet.completedCommission)}</span>
                  </div>
                  <div className="stat-card-item withdrawable">
                    <span className="stat-card-label">Có thể rút ngay (Khả dụng)</span>
                    <span style={{ fontSize: '11px', color: '#ea580c', marginBottom: '4px' }}>Shopee sau 3 ngày • TikTok rút ngay khi xong • Đã trừ thuế & chia 8-2</span>
                    <span className="stat-card-value" style={{ color: '#ea580c' }}>{formatMoney(lookupResult.wallet.withdrawableCommission)}</span>
                  </div>
                  <div className="stat-card-item received">
                    <span className="stat-card-label">Đã nhận (Đã thanh toán)</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tổng tiền đã rút về tài khoản</span>
                    <span className="stat-card-value" style={{ color: '#16a34a' }}>{formatMoney(lookupResult.wallet.receivedCommission)}</span>
                  </div>
                </div>
              </div>

              {/* Payout Request */}
              <div className="lookup-card" style={{ marginBottom: '24px' }}>
                <h3 className="stats-section-title" style={{ margin: 0, marginBottom: '12px' }}>💸 Rút Tiền Hoa Hồng Khả Dụng</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                  Tiền hoa hồng của đơn Shopee &quot;Hoàn thành&quot; sau 3 ngày (đơn TikTok rút ngay khi hoàn thành) sẽ tự động chuyển xuống ví khả dụng để rút (đã trừ thuế và chia 8-2). Lệnh rút tiền sau khi gửi sẽ được duyệt thủ công bởi Trưởng nhóm Phạm Thắng.
                </p>
                {lookupResult.wallet.withdrawableCommission > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                      <label className="lookup-label">Số Tiền Muốn Rút (đ)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input type="text" className="lookup-input" placeholder={`Tối đa: ${formatMoney(lookupResult.wallet.withdrawableCommission)}`}
                          value={payoutAmount}
                          onChange={e => { const val = e.target.value.replace(/[^\d]/g, ''); setPayoutAmount(val ? new Intl.NumberFormat('vi-VN').format(parseFloat(val)) : ''); }} />
                        <button className="lookup-admin-link" style={{ position: 'absolute', right: '8px', fontSize: '11px', padding: '4px 8px', background: '#fff7ed', color: '#ea580c', borderColor: '#fed7aa' }}
                          onClick={() => setPayoutAmount(new Intl.NumberFormat('vi-VN').format(lookupResult.wallet.withdrawableCommission))}>Rút hết</button>
                      </div>
                    </div>
                    {payoutSaveError && <div style={{ color: '#ef4444', fontSize: '12px' }}>⚠️ {payoutSaveError}</div>}
                    <button className="lookup-btn" onClick={() => sendOtpToUser('PAYOUT')} disabled={payoutSaveLoading || !payoutAmount} style={{ marginTop: '4px' }}>
                      {payoutSaveLoading ? (<><div className="lookup-spinner"></div>Đang gửi yêu cầu...</>) : 'Gửi yêu cầu rút tiền'}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '8px', textAlign: 'center', color: '#b91c1c', fontSize: '13px' }}>
                    🔒 Số dư khả dụng của sếp hiện đang là 0đ. Chưa thể rút tiền lúc này.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Orders List */}
          <div className="orders-container">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', width: '100%' }}>
              <h3 className="stats-section-title" style={{ marginBottom: 0, width: '100%', fontSize: '16px', fontWeight: '700', color: 'var(--text-bright)' }}>
                {lookupSearchType === 'ORDER_ID' ? '🛒 Kết Quả Tra Cứu Đơn Hàng' : `🛒 Đơn hàng đã mua (${searchedOrders.length})`}
              </h3>
              {lookupResult && lookupResult.orders && lookupResult.orders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '4px' }}>
                  <div className="lookup-tabs" style={{ marginBottom: 0 }}>
                    <button className={`lookup-tab ${platformFilter === 'ALL' ? 'active' : ''}`} onClick={() => setPlatformFilter('ALL')}>Tất cả ({lookupResult.orders.length})</button>
                    <button className={`lookup-tab ${platformFilter === 'ALL' ? 'active' : ''}`} onClick={() => setPlatformFilter('ALL')}>Tất cả ({lookupResult.orders.length})</button>
                    <button className={`lookup-tab ${platformFilter === 'Shopee' ? 'active' : ''}`} onClick={() => setPlatformFilter('Shopee')}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <svg viewBox="0 0 109.59 122.88" style={{ width: '13px', height: '13px', fill: platformFilter === 'Shopee' ? '#ffffff' : '#ee4d2d', flexShrink: 0 }}>
                          <path d="M74.98,91.98C76.15,82.36,69.96,76.22,53.6,71c-7.92-2.7-11.66-6.24-11.57-11.12 c0.33-5.4,5.36-9.34,12.04-9.47c4.63,0.09,9.77,1.22,14.76,4.56c0.59,0.37,1.01,0.32,1.35-0.2c0.46-0.74,1.61-2.53,2-3.17 c0.26-0.42,0.31-0.96-0.35-1.44c-0.95-0.7-3.6-2.13-5.03-2.72c-3.88-1.62-8.23-2.64-12.86-2.63c-9.77,0.04-17.47,6.22-18.12,14.47 c-0.42,5.95,2.53,10.79,8.86,14.47c1.34,0.78,8.6,3.67,11.49,4.57c9.08,2.83,13.8,7.9,12.69,13.81c-1.01,5.36-6.65,8.83-14.43,8.93 c-6.17-0.24-11.71-2.75-16.02-6.1c-0.11-0.08-0.65-0.5-0.72-0.56c-0.53-0.42-1.11-0.39-1.47,0.15c-0.26,0.4-1.92,2.8-2.34,3.43 c-0.39,0.55-0.18,0.86,0.23,1.2c1.8,1.5,4.18,3.14,5.81,3.97c4.47,2.28,9.32,3.53,14.48,3.72c3.32,0.22,7.5-0.49,10.63-1.81 C70.63,102.67,74.25,97.92,74.98,91.98L74.98,91.98z M54.79,7.18c-10.59,0-19.22,9.98-19.62,22.47h39.25 C74.01,17.16,65.38,7.18,54.79,7.18z M94.99,122.88l-0.41,0l-80.82-0.01h0c-5.5-0.21-9.54-4.66-10.09-10.19l-0.05-1 l-3.61-79.5v0C0,32.12,0,32.06,0,32c0-1.28,1.03-2.33,2.3-2.35l0,0h25.48C28.41,13.15,40.26,0,54.79,0s26.39,13.15,27.01,29.65 h25.4h0.04c1.3,0,2.35,1.05,2.35,2.35c0,0.04,0,0.08,0,0.12v0l-3.96,79.81l-0.04,0.68C105.12,118.21,100.59,122.73,94.99,122.88 L94.99,122.88z" />
                        </svg>
                        <span>Shopee ({lookupResult.orders.filter(o => !o.platform || o.platform === 'Shopee').length})</span>
                      </span>
                    </button>
                    <button className={`lookup-tab ${platformFilter === 'TikTok Shop' ? 'active' : ''}`} onClick={() => setPlatformFilter('TikTok Shop')}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <svg viewBox="0 0 1024 1024" style={{ width: '13px', height: '13px', fill: 'currentColor', flexShrink: 0 }}>
                          <path d="M800 112.962C800 50.575 749.425 0 687.038 0H112.962C50.575 0 0 50.575 0 112.962v574.076C0 749.426 50.575 800 112.962 800h574.076C749.425 800 800 749.426 800 687.038zM662.759 348.916c-51.615.577-99.71-15.027-141.938-43.927v202.874c0 90.166-61.72 167.62-148.996 187.848-119.068 27.165-219.864-58.954-232.577-161.835-13.294-102.884 52.322-193.051 152.892-213.281 19.651-4.045 49.209-4.045 64.458-.577v108.661c-4.692-1.153-9.086-2.31-13.709-2.888-39.304-6.937-77.371 12.715-92.977 48.55-15.605 35.838-5.16 77.451 26.629 101.73 26.586 20.806 56.085 23.694 86.14 9.822 30.057-13.291 46.21-37.567 49.676-70.512.578-4.622.546-9.826.546-15.028V110.206c0-10.981.086-10.502 11.068-10.502h86.12c6.36 0 8.673.915 9.25 8.433 4.621 67.047 55.526 124.147 120.838 132.818 6.937 1.155 14.369 1.613 22.58 2.19z" transform="translate(112 112)"/>
                        </svg>
                        <span>TikTok ({lookupResult.orders.filter(o => o.platform === 'TikTok Shop').length})</span>
                      </span>
                    </button>
                  </div>
                  <input type="text" placeholder="Lọc nhanh theo tên / mã đơn..." className="lookup-input"
                    style={{ width: '100%', maxWidth: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', margin: 0 }}
                    value={lookupLocalFilter} onChange={e => setLookupLocalFilter(e.target.value)} />
                </div>
              )}
            </div>
            {searchedOrders.length === 0 ? (
              <div className="lookup-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>📭 Không tìm thấy đơn hàng nào khớp điều kiện lọc.</div>
            ) : (
              searchedOrders.map(o => (
                <div key={o.id} className="order-card-item">
                  <div className="order-card-header">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-regular fa-calendar" style={{ color: 'var(--text-muted)', fontSize: '13px' }}></i>
                      <span>{formatDateTime(o.purchaseTime)}</span>
                    </span>
                    <span>Mã đơn: <span className="order-id-badge">{o.orderId}</span></span>
                  </div>
                  <div className="order-card-title" title={o.productName}>{o.productName}</div>
                  <div className="order-card-commission-row">
                    <span style={{
                      background: o.status === 'Hoàn thành' ? '#ecfdf5' : o.status === 'Hủy' ? '#fef2f2' : '#fff7ed',
                      color: o.status === 'Hoàn thành' ? '#059669' : o.status === 'Hủy' ? '#dc2626' : '#ea580c',
                      border: `1px solid ${o.status === 'Hoàn thành' ? '#a7f3d0' : o.status === 'Hủy' ? '#fca5a5' : '#fed7aa'}`,
                      fontSize: '11.5px', padding: '4px 10px', borderRadius: '20px', fontWeight: '800'
                    }}>
                      {o.status}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span className="order-commission-label">Hoa hồng: </span>
                      <span className="order-commission-val">{formatMoney(o.commission)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* OTP Modal */}
      {otpModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
          <div className="lookup-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', background: 'var(--bg-card)', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: '#fff7ed', border: '1px solid #fed7aa', boxShadow: '0 0 25px rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '36px' }}>🔒</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '8px', letterSpacing: '-0.3px' }}>Xác Thực Bảo Mật OTP</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px', padding: '0 8px' }}>
              Mã xác thực 6 số vừa được gửi đến <span style={{ color: '#ea580c', fontWeight: '600' }}>tin nhắn riêng Zalo</span> của bạn.
            </p>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '10px 12px', fontSize: '12.5px', color: '#c2410c', marginBottom: '22px', lineHeight: '1.4', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>💡</span>
              <span>Chưa nhận được mã hoặc mã lỗi? Hãy bấm nút <b>Gửi lại mã OTP</b> bên dưới nhé!</span>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <input type="text" maxLength="6" placeholder="• • • • • •" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                style={{ width: '100%', padding: '14px 12px', fontSize: '22px', textAlign: 'center', letterSpacing: '12px', background: 'var(--bg-main)', border: '2px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-bright)', outline: 'none', fontWeight: '700', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 12px rgba(249,115,22,0.25)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }} />
            </div>
            {otpError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#ef4444', marginBottom: '16px' }}>⚠️ {otpError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="lookup-btn" onClick={() => { if (otpActionType === 'BANK') handleSaveBankInfo(otpCode); else handleRequestPayout(otpCode); }}
                disabled={otpCode.length !== 6 || bankSaveLoading || payoutSaveLoading}>
                {(bankSaveLoading || payoutSaveLoading) ? (<><div className="lookup-spinner"></div>Đang xử lý...</>) : '✓ Xác nhận & Thực hiện'}
              </button>
              <button onClick={() => { setOtpModalOpen(false); setOtpCode(''); setOtpError(''); }}
                style={{ background: 'var(--bg-main)', border: '1.5px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '12px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Hủy bỏ
              </button>
              <button onClick={() => sendOtpToUser(otpActionType)}
                disabled={otpSending || otpCountdown > 0}
                style={{ background: 'transparent', border: '1.5px solid var(--border-color)', borderRadius: '20px', padding: '8px 18px', color: (otpSending || otpCountdown > 0) ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '13px', fontWeight: '600', cursor: (otpSending || otpCountdown > 0) ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                {otpSending ? 'Đang gửi lại...' : (otpCountdown > 0 ? `Gửi lại mã sau (${otpCountdown}s)` : 'Gửi lại mã OTP (Miễn phí)')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      {showBanner && (
        <div className="lookup-banner-section">
          <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', padding: '0 16px', lineHeight: '1.4' }}>
            🌟 Tham gia nhóm Zalo nhận hoàn tiền
          </h4>
          <div className="lookup-banner-img-wrap">
            <button className="lookup-banner-close" onClick={e => { e.stopPropagation(); setShowBanner(false); }}>×</button>
            <img src="/banner.jpg" alt="Tham gia Zalo Group nhận hoa hồng" />
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
