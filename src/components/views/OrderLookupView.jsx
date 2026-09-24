import { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import MobileBottomNav from '../common/MobileBottomNav';
import ToastNotification from '../common/ToastNotification';
import ThemeToggle from '../common/ThemeToggle';
import RunningCatMascot from '../common/RunningCatMascot';

export default function OrderLookupView() {
  const { setView, showToast, API_URL_ROOT } = useApp();

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

  // PIN & Security Modal state
  // Modes: 'ENTER_PIN' | 'CREATE_PIN' | 'RESET_PIN'
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState('ENTER_PIN'); 
  const [pendingAction, setPendingAction] = useState(null); // 'BANK' | 'PAYOUT' | null

  const [inputPin, setInputPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [securityOtp, setSecurityOtp] = useState('');
  const [createStep, setCreateStep] = useState(1); // Step 1: Input PIN, Step 2: Input OTP
  
  // Toggle show/hide PIN digits
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showEnterPin, setShowEnterPin] = useState(false);
  
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const pinInputRef = useRef(null);

  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  // Focus input when modal opens
  useEffect(() => {
    if (pinModalOpen) {
      setPinError('');
      const t = setTimeout(() => {
        if (pinInputRef.current) pinInputRef.current.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [pinModalOpen, pinModalMode, createStep]);

  // Auto lookup from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlZaloId = params.get('zaloId');
    const urlOrderId = params.get('orderId') || params.get('query') || params.get('q');
    const urlStartDate = params.get('startDate');
    const urlEndDate = params.get('endDate');

    if (urlStartDate) setLookupStartDate(urlStartDate);
    if (urlEndDate) setLookupEndDate(urlEndDate);

    if (urlToken || urlZaloId) {
      const target = (urlToken || urlZaloId).trim();
      setLookupSearchType('ZALO_ID');
      setLookupQuery('');
      handlePublicLookup(target, 'ZALO_ID');
    } else if (urlOrderId) {
      const target = urlOrderId.trim();
      setLookupSearchType('ORDER_ID');
      setLookupQuery(target);
      handlePublicLookup(target, 'ORDER_ID');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublicLookup = async (overrideQuery = null, overrideType = null) => {
    const rawQ = overrideQuery !== null ? overrideQuery : lookupQuery;
    if (!rawQ || !rawQ.trim()) {
      setLookupError('Vui lòng nhập từ khóa tìm kiếm');
      showToast('Vui lòng nhập từ khóa tìm kiếm', 'error');
      return;
    }
    const q = rawQ.trim();
    let type = overrideType !== null ? overrideType : lookupSearchType;

    // Tự động nhận diện nếu query là token Base64 hoặc Zalo ID dạng chuỗi số 15-20 số
    if (type === 'ORDER_ID' && (q.length > 25 || /^[0-9]{15,25}$/.test(q))) {
      type = 'ZALO_ID';
    }

    if (overrideType !== null) setLookupSearchType(type);
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      let url = `${API_URL_ROOT}/api/public/lookup?searchType=${type}&query=${encodeURIComponent(q)}`;
      if (lookupStartDate) url += `&startDate=${lookupStartDate}`;
      if (lookupEndDate) url += `&endDate=${lookupEndDate}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi tra cứu thông tin');
      setLookupResult(json.data);
      if (type === 'ORDER_ID') {
        setLookupRecentSearches(prev => {
          const item = { query: q, searchType: type };
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

  // Trigger PIN flow for actions
  const initiateAction = (action) => {
    if (action === 'BANK') {
      if (!editBankName.trim() || !editAccountNumber.trim()) {
        setBankSaveError('Vui lòng điền đầy đủ tên ngân hàng và số tài khoản');
        return;
      }
      setBankSaveError('');
    } else if (action === 'PAYOUT') {
      const amountVal = parseFloat(payoutAmount.replace(/[^\d]/g, ''));
      if (isNaN(amountVal) || amountVal <= 0) {
        setPayoutSaveError('Vui lòng nhập số tiền rút hợp lệ (lớn hơn 0đ)');
        return;
      }
      if (!lookupResult?.bankName || !lookupResult?.accountNumber) {
        setPayoutSaveError('Vui lòng thiết lập thông tin ngân hàng nhận tiền trước');
        return;
      }
      setPayoutSaveError('');
    }

    setPendingAction(action);
    setInputPin('');
    setPinError('');

    if (!lookupResult?.hasPin) {
      // User hasn't created a PIN yet -> Open CREATE_PIN mode
      setPinModalMode('CREATE_PIN');
      setCreateStep(1);
      setNewPin('');
      setConfirmPin('');
      setSecurityOtp('');
      setPinModalOpen(true);
    } else {
      // User has PIN -> Open ENTER_PIN mode
      setPinModalMode('ENTER_PIN');
      setPinModalOpen(true);
    }
  };

  // Send OTP via Zalo
  const requestZaloOtp = async () => {
    if (otpCountdown > 0) {
      showToast(`Vui lòng đợi ${otpCountdown}s trước khi gửi lại OTP!`, 'warning');
      return;
    }
    setOtpSending(true);
    setPinError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaloId: lookupResult.zaloId,
          zaloName: lookupResult.zaloName || 'Sếp'
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi gửi mã OTP');
      setOtpCountdown(60);
      showToast('Đã gửi mã xác thực OTP 6 số về tin nhắn Zalo của sếp!', 'success');
    } catch (err) {
      setPinError(err.message);
      showToast(err.message, 'error');
    } finally {
      setOtpSending(false);
    }
  };

  // Execute the pending action (Bank Save or Payout) with verified PIN
  const executePendingActionWithPin = async (pinToUse) => {
    if (pendingAction === 'BANK') {
      setBankSaveLoading(true);
      setPinLoading(true);
      try {
        const res = await fetch(`${API_URL_ROOT}/api/public/bank-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zaloId: lookupResult.zaloId,
            bankName: editBankName.trim(),
            accountNumber: editAccountNumber.trim(),
            pin: pinToUse
          })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Lỗi khi lưu thông tin ngân hàng');
        setLookupResult(prev => ({ ...prev, bankName: editBankName.trim(), accountNumber: editAccountNumber.trim() }));
        setIsEditingBank(false);
        setPinModalOpen(false);
        showToast('✓ Đã cập nhật thông tin ngân hàng thành công!', 'success');
      } catch (err) {
        setPinError(err.message);
        showToast(err.message, 'error');
      } finally {
        setBankSaveLoading(false);
        setPinLoading(false);
      }
    } else if (pendingAction === 'PAYOUT') {
      const amountVal = parseFloat(payoutAmount.replace(/[^\d]/g, ''));
      setPayoutSaveLoading(true);
      setPinLoading(true);
      try {
        const res = await fetch(`${API_URL_ROOT}/api/public/payout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zaloId: lookupResult.zaloId,
            amount: amountVal,
            pin: pinToUse
          })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Lỗi khi yêu cầu rút tiền');
        setPayoutAmount('');
        setPinModalOpen(false);
        showToast('🎉 Yêu cầu rút tiền thành công! Trưởng nhóm sẽ duyệt và chuyển khoản sớm nhất!', 'success');
        handlePublicLookup(lookupResult.zaloId, 'ZALO_ID');
      } catch (err) {
        setPinError(err.message);
        showToast(err.message, 'error');
      } finally {
        setPayoutSaveLoading(false);
        setPinLoading(false);
      }
    }
  };

  // Submit Enter PIN
  const handleConfirmEnterPin = async () => {
    if (inputPin.length !== 6) {
      setPinError('Vui lòng nhập đủ 6 chữ số mã PIN');
      return;
    }
    setPinLoading(true);
    setPinError('');
    try {
      // Direct verify
      const res = await fetch(`${API_URL_ROOT}/api/public/pin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zaloId: lookupResult.zaloId, pin: inputPin })
      });
      const json = await res.json();
      if (!res.ok || json.data === false) throw new Error(json.message || 'Mã PIN không chính xác');
      
      // Execute the pending action
      await executePendingActionWithPin(inputPin);
    } catch (err) {
      setPinError(err.message);
      showToast(err.message, 'error');
      setPinLoading(false);
    }
  };

  // Submit Create PIN - Step 1: validate PIN -> Request OTP -> Move to Step 2
  const handleCreatePinStep1 = async () => {
    if (!/^\d{6}$/.test(newPin)) {
      setPinError('Mã PIN phải gồm đúng 6 chữ số');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Mã PIN nhập lại không khớp. Vui lòng kiểm tra lại!');
      return;
    }
    setPinError('');
    await requestZaloOtp();
    setCreateStep(2);
  };

  // Submit Create PIN - Step 2: verify OTP & create PIN -> execute action
  const handleCreatePinComplete = async () => {
    if (securityOtp.length !== 6) {
      setPinError('Vui lòng nhập đủ 6 số mã OTP từ Zalo');
      return;
    }
    setPinLoading(true);
    setPinError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/pin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaloId: lookupResult.zaloId,
          pin: newPin,
          otp: securityOtp
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi kích hoạt mã PIN');
      
      setLookupResult(prev => ({ ...prev, hasPin: true }));
      showToast('🎉 Đã tạo mã PIN rút tiền 6 số thành công!', 'success');

      // Continue to execute pending action if any
      if (pendingAction) {
        await executePendingActionWithPin(newPin);
      } else {
        setPinModalOpen(false);
      }
    } catch (err) {
      setPinError(err.message);
      showToast(err.message, 'error');
    } finally {
      setPinLoading(false);
    }
  };

  // Switch to Forgot PIN (Reset PIN mode)
  const handleStartResetPin = async () => {
    setPinModalMode('RESET_PIN');
    setNewPin('');
    setConfirmPin('');
    setSecurityOtp('');
    setPinError('');
    await requestZaloOtp();
  };

  // Submit Reset PIN
  const handleResetPinComplete = async () => {
    if (securityOtp.length !== 6) {
      setPinError('Vui lòng nhập đủ 6 số mã OTP từ Zalo');
      return;
    }
    if (!/^\d{6}$/.test(newPin)) {
      setPinError('Mã PIN mới phải gồm đúng 6 chữ số');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Mã PIN nhập lại không khớp!');
      return;
    }
    setPinLoading(true);
    setPinError('');
    try {
      const res = await fetch(`${API_URL_ROOT}/api/public/pin/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaloId: lookupResult.zaloId,
          newPin: newPin,
          otp: securityOtp
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi đặt lại mã PIN');
      
      setLookupResult(prev => ({ ...prev, hasPin: true }));
      showToast('🎉 Đặt lại mã PIN thành công!', 'success');
      
      if (pendingAction) {
        await executePendingActionWithPin(newPin);
      } else {
        setPinModalOpen(false);
      }
    } catch (err) {
      setPinError(err.message);
      showToast(err.message, 'error');
    } finally {
      setPinLoading(false);
    }
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
        .pin-digit-dots { display: flex; justify-content: center; gap: 8px; margin: 12px 0; }
        .pin-box-item { width: 44px; height: 50px; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--bg-main); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: var(--text-bright); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; user-select: none; }
        .pin-box-item.filled { border-color: #ea580c; background: rgba(249, 115, 22, 0.08); box-shadow: 0 0 12px rgba(234, 88, 12, 0.25); color: #ea580c; }
        .pin-box-item.active { border-color: #f97316; box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2); }
        .pin-dot-bullet { width: 12px; height: 12px; border-radius: 50%; background: #ea580c; box-shadow: 0 0 6px rgba(234, 88, 12, 0.5); }
        .pin-hidden-input { position: absolute; opacity: 0; pointer-events: auto; width: calc(100% - 50px); height: 100%; top: 0; left: 0; z-index: 2; }
        @media (max-width: 480px) { .pin-box-item { width: 36px; height: 44px; font-size: 17px; border-radius: 9px; } .pin-digit-dots { gap: 6px; } }
        @media (max-width: 480px) { .stats-cards-grid { grid-template-columns: 1fr; } .stats-cards-grid > :first-child { grid-column: span 1; } .lookup-card { padding: 16px; } .stat-card-value { font-size: 20px; } .lookup-banner-img-wrap { width: 100%; max-width: 280px; } }
      `}} />

      <ToastNotification />

      {/* Header */}
      <div className="lookup-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', flexWrap: 'nowrap', gap: '6px', boxSizing: 'border-box' }}>
        <div className="lookup-logo" onClick={() => { setView('home'); window.history.pushState({}, '', '/'); }} style={{ display: 'flex', alignItems: 'center', flexShrink: 1, minWidth: 0, cursor: 'pointer' }}>
          <img src="/28symueslogomanin.png?v=7" alt="28Symues Affiliate Logo" style={{ height: 'clamp(80px, 18vw, 110px)', width: 'auto', maxWidth: '380px', flexShrink: 0, objectFit: 'contain' }} />
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
                    <input type="text" className="lookup-input" placeholder="Ví dụ: MB, Techcombank, Vietcombank..." value={editBankName} onChange={e => setEditBankName(e.target.value)} />
                  </div>
                  <div className="lookup-input-group" style={{ marginBottom: 0 }}>
                    <label className="lookup-label">Số Tài Khoản</label>
                    <input type="text" className="lookup-input" placeholder="Số tài khoản ngân hàng..." value={editAccountNumber} onChange={e => setEditAccountNumber(e.target.value)} />
                  </div>
                </div>
                {bankSaveError && <div style={{ color: '#ef4444', fontSize: '12px' }}>⚠️ {bankSaveError}</div>}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button className="lookup-admin-link" style={{ padding: '6px 14px', background: 'var(--bg-main)', color: 'var(--text-muted)' }} onClick={() => setIsEditingBank(false)} disabled={bankSaveLoading}>Hủy</button>
                  <button className="lookup-btn" style={{ width: 'auto', padding: '6px 16px', fontSize: '13px' }} onClick={() => initiateAction('BANK')} disabled={bankSaveLoading}>
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
            <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="stat-card-item pending">
                <span className="stat-card-label">ĐANG CHỜ XỬ LÝ</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>(Đang vận chuyển / chưa xác nhận)</span>
                <span className="stat-card-value">{formatMoney(lookupResult.wallet.pendingCommission)}</span>
              </div>
              <div className="stat-card-item completed">
                <span className="stat-card-label">ĐÃ HOÀN THÀNH</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>(Hoàn thành • Chưa đủ 3 ngày để rút)</span>
                <span className="stat-card-value">{formatMoney(lookupResult.wallet.completedNotYetWithdrawable != null ? lookupResult.wallet.completedNotYetWithdrawable : lookupResult.wallet.completedCommission)}</span>
              </div>
              <div className="stat-card-item withdrawable">
                <span className="stat-card-label">SỐ DƯ KHẢ DỤNG</span>
                {lookupResult.wallet.pendingWithdrawn > 0 ? (
                  <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold', marginBottom: '4px' }}>
                    (Đang chờ duyệt rút: {formatMoney(lookupResult.wallet.pendingWithdrawn)})
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#ea580c', marginBottom: '4px' }}>
                    (Sau 3 ngày • Trừ thuế & chia 8-2)
                  </span>
                )}
                <span className="stat-card-value" style={{ color: '#ea580c' }}>{formatMoney(lookupResult.wallet.withdrawableCommission)}</span>
              </div>
              <div className="stat-card-item received">
                <span className="stat-card-label">ĐÃ NHẬN (ĐÃ THANH TOÁN)</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>(Tổng tiền đã rút về bank)</span>
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
                <button className="lookup-btn" onClick={() => initiateAction('PAYOUT')} disabled={payoutSaveLoading || !payoutAmount} style={{ marginTop: '4px' }}>
                  {payoutSaveLoading ? (<><div className="lookup-spinner"></div>Đang gửi yêu cầu...</>) : 'Gửi yêu cầu rút tiền'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '8px', textAlign: 'center', color: '#b91c1c', fontSize: '13px' }}>
                🔒 Số dư khả dụng của sếp hiện đang là 0đ. Chưa thể rút tiền lúc này.
              </div>
            )}
          </div>

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

      {/* ===================== PIN & SECURITY MODAL ===================== */}
      {pinModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
          <div className="lookup-card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', background: 'var(--bg-card)', padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
            
            {/* Top Icon Badge */}
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1.5px solid #fed7aa', boxShadow: '0 0 25px rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '30px' }}>
              {pinModalMode === 'CREATE_PIN' ? '✨' : pinModalMode === 'RESET_PIN' ? '🔑' : '🔒'}
            </div>

            {/* MODE 1: ENTER PIN (Standard 6-digit confirmation) */}
            {pinModalMode === 'ENTER_PIN' && (
              <>
                <h3 style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '6px' }}>
                  Xác Nhận Mã PIN Rút Tiền
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px', padding: '0 4px' }}>
                  Nhập mã PIN 6 số bảo mật của <strong style={{ color: '#ea580c' }}>{lookupResult?.zaloName || 'sếp'}</strong> để {pendingAction === 'BANK' ? 'cập nhật tài khoản ngân hàng' : 'gửi yêu cầu rút tiền'}.
                </p>

                {/* 6 Digit Box Display */}
                <div style={{ position: 'relative', margin: '20px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div 
                      className="pin-digit-dots" 
                      onClick={() => pinInputRef.current?.focus()} 
                      style={{ cursor: 'pointer', margin: 0, position: 'relative', zIndex: 1 }}
                    >
                      {[0, 1, 2, 3, 4, 5].map(idx => {
                        const isFilled = inputPin.length > idx;
                        const isActive = inputPin.length === idx;
                        const digit = isFilled ? inputPin[idx] : '';
                        return (
                          <div 
                            key={idx} 
                            className={`pin-box-item ${isFilled ? 'filled' : ''} ${isActive ? 'active' : ''}`}
                          >
                            {isFilled ? (
                              showEnterPin ? (
                                <span style={{ animation: 'pinPopIn 0.15s ease-out' }}>{digit}</span>
                              ) : (
                                <div className="pin-dot-bullet" />
                              )
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowEnterPin(prev => !prev);
                      }}
                      style={{
                        position: 'relative',
                        zIndex: 10,
                        background: 'var(--bg-main)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '10px',
                        color: showEnterPin ? '#ea580c' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: showEnterPin ? '0 0 10px rgba(234,88,12,0.2)' : 'none'
                      }}
                      title={showEnterPin ? "Ẩn mã PIN" : "Hiện mã PIN"}
                    >
                      {showEnterPin ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={inputPin}
                    onChange={e => {
                      const val = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                      setInputPin(val);
                      if (val.length === 6) {
                        setPinError('');
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && inputPin.length === 6) handleConfirmEnterPin();
                    }}
                    className="pin-hidden-input"
                    autoFocus
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {inputPin.length === 6 ? '✓ Đã nhập đủ 6 số' : `Chạm để nhập (${inputPin.length}/6 số)`}
                  </div>
                </div>

                {pinError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px', fontSize: '13px', color: '#ef4444', marginBottom: '16px', textAlign: 'left', fontWeight: '600' }}>
                    ⚠️ {pinError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="lookup-btn" onClick={handleConfirmEnterPin} disabled={inputPin.length !== 6 || pinLoading || bankSaveLoading || payoutSaveLoading}>
                    {(pinLoading || bankSaveLoading || payoutSaveLoading) ? (<><div className="lookup-spinner"></div>Đang xác nhận...</>) : '✓ Xác nhận giao dịch'}
                  </button>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <button onClick={handleStartResetPin} style={{ background: 'transparent', border: 'none', color: '#ea580c', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>
                      Quên mã PIN?
                    </button>
                    <button onClick={() => { setPinModalOpen(false); setInputPin(''); setPinError(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* MODE 2: CREATE PIN (First-time user onboarding) */}
            {pinModalMode === 'CREATE_PIN' && (
              <>
                <h3 style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '6px' }}>
                  Tạo Mã PIN Rút Tiền (6 Số)
                </h3>
                
                {createStep === 1 ? (
                  <>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                      Để bảo vệ tài sản và rút tiền nhanh chóng không cần chờ OTP mỗi lần, vui lòng thiết lập mã PIN 6 số bí mật.
                    </p>

                    <div className="lookup-input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                      <label className="lookup-label">Mã PIN mới (6 chữ số)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          ref={pinInputRef}
                          type={showNewPin ? "text" : "password"}
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Nhập 6 số PIN..."
                          className="lookup-input"
                          style={{ paddingRight: '42px' }}
                          value={newPin}
                          onChange={e => setNewPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            color: showNewPin ? '#ea580c' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                          }}
                          title={showNewPin ? "Ẩn mã PIN" : "Hiện mã PIN"}
                        >
                          {showNewPin ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="lookup-input-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                      <label className="lookup-label">Xác nhận lại mã PIN (6 số)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showConfirmPin ? "text" : "password"}
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Nhập lại 6 số PIN..."
                          className="lookup-input"
                          style={{ paddingRight: '42px' }}
                          value={confirmPin}
                          onChange={e => setConfirmPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            color: showConfirmPin ? '#ea580c' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                          }}
                          title={showConfirmPin ? "Ẩn mã PIN" : "Hiện mã PIN"}
                        >
                          {showConfirmPin ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {pinError && (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px', fontSize: '13px', color: '#ef4444', marginBottom: '16px', textAlign: 'left' }}>
                        ⚠️ {pinError}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button className="lookup-btn" onClick={handleCreatePinStep1} disabled={newPin.length !== 6 || confirmPin.length !== 6 || otpSending}>
                        {otpSending ? (<><div className="lookup-spinner"></div>Đang gửi OTP...</>) : 'Tiếp tục (Nhận OTP qua Zalo) →'}
                      </button>
                      <button onClick={() => { setPinModalOpen(false); setPinError(''); }} style={{ background: 'var(--bg-main)', border: '1.5px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        Hủy bỏ
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                      Mã xác thực OTP 6 số đã được gửi tới tin nhắn Zalo của <strong style={{ color: '#ea580c' }}>{lookupResult?.zaloName}</strong> để kích hoạt mã PIN.
                    </p>

                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="• • • • • •"
                        value={securityOtp}
                        onChange={e => setSecurityOtp(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                        style={{ width: '100%', padding: '12px', fontSize: '22px', textAlign: 'center', letterSpacing: '10px', background: 'var(--bg-main)', border: '2px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-bright)', outline: 'none', fontWeight: '800' }}
                      />
                    </div>

                    {pinError && (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px', fontSize: '13px', color: '#ef4444', marginBottom: '16px', textAlign: 'left' }}>
                        ⚠️ {pinError}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button className="lookup-btn" onClick={handleCreatePinComplete} disabled={securityOtp.length !== 6 || pinLoading}>
                        {pinLoading ? (<><div className="lookup-spinner"></div>Đang hoàn tất...</>) : (
                          <>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Kích hoạt PIN & Tiếp tục</span>
                          </>
                        )}
                      </button>

                      <button 
                        onClick={requestZaloOtp} 
                        disabled={otpSending || otpCountdown > 0} 
                        style={{ 
                          background: 'var(--bg-main)', 
                          border: '1.5px solid var(--border-color)', 
                          borderRadius: '12px', 
                          padding: '11px 16px', 
                          color: (otpSending || otpCountdown > 0) ? 'var(--text-muted)' : 'var(--text-bright)', 
                          fontSize: '13px', 
                          fontWeight: '700', 
                          cursor: (otpSending || otpCountdown > 0) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {otpSending ? (
                          <><div className="lookup-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#ea580c' }}></div>Đang gửi mã...</>
                        ) : otpCountdown > 0 ? (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ea580c' }}>
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Gửi lại OTP sau ({otpCountdown}s)</span>
                          </>
                        ) : (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0284c7' }}>
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>Gửi lại OTP qua Zalo</span>
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => setCreateStep(1)} 
                        style={{ 
                          background: 'rgba(249, 115, 22, 0.06)', 
                          border: '1.5px solid rgba(249, 115, 22, 0.3)', 
                          borderRadius: '12px', 
                          padding: '10px 16px', 
                          color: '#ea580c', 
                          fontSize: '13px', 
                          fontWeight: '700', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          marginTop: '2px'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.14)'; e.currentTarget.style.borderColor = '#ea580c'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.06)'; e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'; }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Sửa lại mã PIN</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* MODE 3: RESET PIN (Forgot PIN recovery) */}
            {pinModalMode === 'RESET_PIN' && (
              <>
                <h3 style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '6px' }}>
                  Đặt Lại Mã PIN Rút Tiền
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                  Nhập mã OTP vừa gửi về Zalo của bạn và thiết lập lại mã PIN 6 số mới.
                </p>

                <div className="lookup-input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                  <label className="lookup-label">Mã OTP từ Zalo (6 số)</label>
                  <input
                    ref={pinInputRef}
                    type="text"
                    maxLength={6}
                    placeholder="Mã OTP 6 số..."
                    className="lookup-input"
                    value={securityOtp}
                    onChange={e => setSecurityOtp(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  />
                </div>

                <div className="lookup-input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
                  <label className="lookup-label">Mã PIN Mới (6 số)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showNewPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Nhập 6 số PIN mới..."
                      className="lookup-input"
                      style={{ paddingRight: '42px' }}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: showNewPin ? '#ea580c' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s'
                      }}
                      title={showNewPin ? "Ẩn mã PIN" : "Hiện mã PIN"}
                    >
                      {showNewPin ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="lookup-input-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                  <label className="lookup-label">Xác nhận lại PIN Mới (6 số)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showConfirmPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Nhập lại 6 số PIN mới..."
                      className="lookup-input"
                      style={{ paddingRight: '42px' }}
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: showConfirmPin ? '#ea580c' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s'
                      }}
                      title={showConfirmPin ? "Ẩn mã PIN" : "Hiện mã PIN"}
                    >
                      {showConfirmPin ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {pinError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px', fontSize: '13px', color: '#ef4444', marginBottom: '16px', textAlign: 'left' }}>
                    ⚠️ {pinError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="lookup-btn" onClick={handleResetPinComplete} disabled={securityOtp.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6 || pinLoading}>
                    {pinLoading ? (<><div className="lookup-spinner"></div>Đang lưu PIN mới...</>) : '✓ Xác nhận & Đổi PIN mới'}
                  </button>
                  <button 
                    onClick={requestZaloOtp} 
                    disabled={otpSending || otpCountdown > 0} 
                    style={{ 
                      background: 'var(--bg-main)', 
                      border: '1.5px solid var(--border-color)', 
                      borderRadius: '12px', 
                      padding: '11px 16px', 
                      color: (otpSending || otpCountdown > 0) ? 'var(--text-muted)' : 'var(--text-bright)', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      cursor: (otpSending || otpCountdown > 0) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {otpSending ? 'Đang gửi...' : (otpCountdown > 0 ? `Gửi lại OTP (${otpCountdown}s)` : 'Gửi lại OTP qua Zalo')}
                  </button>
                  <button 
                    onClick={() => { setPinModalMode('ENTER_PIN'); setPinError(''); }} 
                    style={{ 
                      background: 'rgba(249, 115, 22, 0.06)', 
                      border: '1.5px solid rgba(249, 115, 22, 0.3)', 
                      borderRadius: '12px', 
                      padding: '10px 16px', 
                      color: '#ea580c', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      marginTop: '2px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.14)'; e.currentTarget.style.borderColor = '#ea580c'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.06)'; e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'; }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Quay lại nhập mã PIN</span>
                  </button>
                </div>
              </>
            )}

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
