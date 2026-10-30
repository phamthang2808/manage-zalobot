import { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import RunningCatMascot from '../common/RunningCatMascot';
import CopyButton from '../common/CopyButton';

export default function OrderLookupView({ setView: propSetView } = {}) {
  const { setView: contextSetView, showToast, API_URL_ROOT } = useApp();
  const setView = propSetView || contextSetView;

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    if (propSetView) propSetView('home');
    if (contextSetView) contextSetView('home');
    sessionStorage.removeItem('adminView');
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  const [referralExpanded, setReferralExpanded] = useState(false); // Ẩn mặc định, người dùng ấn mở ra khi cần

  // Bank info state
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [bankSaveError, setBankSaveError] = useState('');
  const [bankSaveLoading, setBankSaveLoading] = useState(false);
  const [verifiedPin, setVerifiedPin] = useState('');

  // Hàm ẩn số tài khoản ngân hàng: Chỉ hiển thị 2 số đầu và 3 số cuối (ví dụ: 12*****789)
  const maskAccountNumber = (acc) => {
    if (!acc) return 'Chưa thiết lập';
    const s = String(acc).trim();
    if (s.length <= 5) {
      return s.length > 2 ? s.slice(0, 1) + '***' + s.slice(-1) : '***';
    }
    const start = s.slice(0, 2);
    const end = s.slice(-3);
    const mask = '*'.repeat(Math.max(s.length - 5, 3));
    return `${start}${mask}${end}`;
  };

  const parseDateInfo = (o) => {
    const s = (o.status || '').toLowerCase();
    const isCompleted =
      s.includes('hoàn thành') ||
      s.includes('thành công') ||
      s.includes('completed') ||
      s.includes('success') ||
      s.includes('đã chốt') ||
      s.includes('đã hoàn');

    const isCancelled =
      s.includes('hủy') ||
      s.includes('cancel') ||
      s.includes('refund') ||
      s.includes('từ chối');

    // 1. Phân tích ngày đặt hàng (orderDate / purchaseTime)
    let orderDateObj = null;
    const orderRaw = o.purchaseTime || o.orderTime || o.orderDate || o.createdAt;
    if (orderRaw) {
      const parsed = new Date(orderRaw);
      if (!isNaN(parsed.getTime())) orderDateObj = parsed;
    }
    if (!orderDateObj && o.orderId && /^\d{6}/.test(o.orderId)) {
      const yr = 2000 + parseInt(o.orderId.substring(0, 2), 10);
      const mo = parseInt(o.orderId.substring(2, 4), 10) - 1;
      const da = parseInt(o.orderId.substring(4, 6), 10);
      const testD = new Date(yr, mo, da);
      if (!isNaN(testD.getTime())) orderDateObj = testD;
    }
    if (!orderDateObj) orderDateObj = new Date();

    // 2. Nếu đơn ĐÃ HOÀN THÀNH: bắt buộc có ngày hoàn thành
    if (isCompleted) {
      let completeDateObj = null;
      const completeRaw =
        o.completeTime ||
        o.completedDate ||
        o.completedAt ||
        o.finishTime ||
        o.updateTime;

      if (completeRaw) {
        const parsed = new Date(completeRaw);
        if (!isNaN(parsed.getTime())) completeDateObj = parsed;
      }

      // Nếu trong data thiếu completeTime hoặc completeTime bị trùng đúng ngày đặt:
      // Tự động tính ngày hoàn thành = ngày đặt + 3 ngày (thực tế vận chuyển & hoàn tất)
      if (!completeDateObj || completeDateObj.toDateString() === orderDateObj.toDateString()) {
        const derived = new Date(orderDateObj.getTime() + 3 * 24 * 60 * 60 * 1000);
        const now = new Date();
        completeDateObj = derived > now ? now : derived;
      }

      const day = String(completeDateObj.getDate()).padStart(2, '0');
      const monthNum = completeDateObj.getMonth() + 1;
      const monthStr = String(monthNum).padStart(2, '0');

      return {
        day,
        month: `TH${monthNum}`,
        labelText: `Ngày hoàn thành ${day}/${monthStr}`,
        isCompleted: true
      };
    }

    // 3. Nếu đơn ĐÃ HỦY:
    if (isCancelled) {
      let cancelDateObj = null;
      const cancelRaw = o.cancelTime || o.updateTime || o.createdAt;
      if (cancelRaw) {
        const parsed = new Date(cancelRaw);
        if (!isNaN(parsed.getTime())) cancelDateObj = parsed;
      }
      if (!cancelDateObj) cancelDateObj = orderDateObj;

      const day = String(cancelDateObj.getDate()).padStart(2, '0');
      const monthNum = cancelDateObj.getMonth() + 1;
      const monthStr = String(monthNum).padStart(2, '0');

      return {
        day,
        month: `TH${monthNum}`,
        labelText: `Đã hủy ${day}/${monthStr}`,
        isCancelled: true
      };
    }

    // 4. Nếu đơn ĐANG XỬ LÝ (Chưa hoàn thành -> ô lịch hiển thị ngày ghi nhận đơn)
    const day = String(orderDateObj.getDate()).padStart(2, '0');
    const monthNum = orderDateObj.getMonth() + 1;
    const monthStr = String(monthNum).padStart(2, '0');

    return {
      day,
      month: `TH${monthNum}`,
      labelText: `Ghi nhận ${day}/${monthStr}`,
      isPending: true
    };
  };

  const getShortOrderDate = (o) => {
    let raw = o.purchaseTime || o.orderTime || o.orderDate || o.createdAt;
    let d = null;
    if (raw) {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
    if (!d && o.orderId && /^\d{6}/.test(o.orderId)) {
      const yr = 2000 + parseInt(o.orderId.substring(0, 2), 10);
      const mo = parseInt(o.orderId.substring(2, 4), 10) - 1;
      const da = parseInt(o.orderId.substring(4, 6), 10);
      const testD = new Date(yr, mo, da);
      if (!isNaN(testD.getTime())) d = testD;
    }
    if (!d) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

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

  // Bắt đầu sửa STK / xem chi tiết: Luôn yêu cầu nhập mã PIN trước
  const handleStartEditBank = () => {
    setBankSaveError('');
    setPendingAction('UNLOCK_BANK');
    setInputPin('');
    setPinError('');

    if (!lookupResult?.hasPin) {
      // User chưa tạo mã PIN -> Mở luồng tạo mã PIN
      setPinModalMode('CREATE_PIN');
      setCreateStep(1);
      setNewPin('');
      setConfirmPin('');
      setSecurityOtp('');
      setPinModalOpen(true);
    } else {
      // User đã có PIN -> Mở modal nhập mã PIN 6 số ngay
      setPinModalMode('ENTER_PIN');
      setPinModalOpen(true);
    }
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

  // Lưu thông tin ngân hàng sau khi sửa xong (dùng verifiedPin đã xác thực ở bước mở khóa)
  const handleSaveBank = async () => {
    if (!editBankName.trim() || !editAccountNumber.trim()) {
      setBankSaveError('Vui lòng điền đầy đủ tên ngân hàng và số tài khoản');
      return;
    }
    setBankSaveError('');
    setBankSaveLoading(true);
    try {
      let pinToUse = verifiedPin;
      if (!pinToUse) {
        initiateAction('BANK');
        setBankSaveLoading(false);
        return;
      }

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
      setVerifiedPin('');
      showToast('✓ Đã cập nhật thông tin ngân hàng thành công!', 'success');
    } catch (err) {
      setBankSaveError(err.message);
      showToast(err.message, 'error');
    } finally {
      setBankSaveLoading(false);
    }
  };

  // Execute the pending action (Bank Unlock, Bank Save or Payout) with verified PIN
  const executePendingActionWithPin = async (pinToUse) => {
    if (pendingAction === 'UNLOCK_BANK') {
      setVerifiedPin(pinToUse);
      setEditBankName(lookupResult?.bankName || '');
      setEditAccountNumber(lookupResult?.accountNumber || '');
      setBankSaveError('');
      setIsEditingBank(true);
      setPinModalOpen(false);
      setPinLoading(false);
      showToast('✓ Xác thực PIN thành công! Sếp có thể xem chi tiết & sửa STK.', 'success');
      return;
    } else if (pendingAction === 'BANK') {
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
        setVerifiedPin('');
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
        .lookup-page-container { min-height: 100vh; width: 100%; background: var(--bg-main); color: var(--text-main); font-family: var(--font-sans); padding: 16px; display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; }
        .lookup-page-container::before { content: ''; position: absolute; top: -15%; left: -10%; width: 700px; height: 700px; background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, rgba(234,88,12,0.02) 40%, transparent 70%); z-index: 1; pointer-events: none; animation: lookupFloatOrb1 8s ease-in-out infinite; }
        .lookup-page-container::after { content: ''; position: absolute; bottom: -20%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(249,115,22,0.06) 0%, rgba(234,88,12,0.015) 40%, transparent 70%); z-index: 1; pointer-events: none; animation: lookupFloatOrb2 10s ease-in-out infinite; }
        @keyframes lookupFloatOrb1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.1); } }
        @keyframes lookupFloatOrb2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-30px,-40px) scale(1.05); } }
        .lookup-card, .lookup-card * { box-sizing: border-box !important; }
        .lookup-header, .lookup-card, .stats-container, .orders-container, .lookup-error { position: relative; z-index: 2; }
        .lookup-header { width: 100%; max-width: 820px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); }
        .lookup-logo { font-size: 18px; font-weight: 650; color: var(--text-bright); display: flex; align-items: center; gap: 8px; font-family: var(--font-heading); }
        .lookup-logo img { border: none; }
        .lookup-admin-link { font-size: 13px; color: var(--text-bright); text-decoration: none; background: var(--bg-card); padding: 7px 16px; border-radius: 20px; border: 1px solid var(--border-color); font-weight: 600; transition: all 0.2s ease; cursor: pointer; }
        .lookup-admin-link:hover { background: rgba(249,115,22,0.08); color: #ea580c; border-color: rgba(249,115,22,0.4); }
        .lookup-card { width: 100%; max-width: 820px; box-sizing: border-box !important; background: var(--bg-card); border: 1px solid var(--border-color); backdrop-filter: blur(16px); border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06); margin-bottom: 20px; overflow: hidden; }
        .lookup-title { font-family: var(--font-heading); font-size: 21px; font-weight: 650; text-align: center; color: var(--text-bright); margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: -0.3px; }
        .lookup-subtitle { font-size: 13.5px; color: var(--text-muted); font-weight: 500; text-align: center; margin-bottom: 24px; }
        .lookup-tabs { display: flex; background: var(--bg-main); border: 1px solid var(--border-color); padding: 3px; border-radius: 12px; margin-bottom: 16px; gap: 2px; width: 100%; box-sizing: border-box; }
        .lookup-tab { flex: 1; min-width: 0; text-align: center; padding: 8px 4px; font-size: 12px; font-weight: 600; border-radius: 9px; cursor: pointer; background: transparent; border: none; color: var(--text-muted); transition: all 0.2s ease; white-space: nowrap; }
        @media (max-width: 480px) { .lookup-tab { font-size: 11.5px; padding: 7px 2px; } }
        .lookup-tab:hover { color: var(--text-bright); }
        .lookup-tab.active { background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff !important; box-shadow: 0 2px 10px rgba(249,115,22,0.3); font-weight: 600; }
        .lookup-input-group { margin-bottom: 16px; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
        .lookup-label { display: block; font-size: 11.5px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .lookup-input { width: 100% !important; min-width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px; color: var(--text-bright); font-size: 14.5px; font-weight: 500; font-family: var(--font-sans); outline: none; transition: all 0.2s ease; display: block !important; -webkit-appearance: none; appearance: none; }
        input[type="date"].lookup-input { width: 100% !important; min-width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; display: block !important; }
        .lookup-input:focus { border-color: #f97316; background: var(--bg-card); box-shadow: 0 0 0 3px rgba(249,115,22,0.18); }
        .lookup-date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
        @media (max-width: 768px) { .lookup-date-grid { display: flex !important; flex-direction: column !important; gap: 16px !important; } }
        .lookup-btn { width: 100%; max-width: 100% !important; box-sizing: border-box !important; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; font-size: 15px; font-weight: 600; font-family: var(--font-heading); border: none; border-radius: 12px; padding: 13px; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(249,115,22,0.28); }
        .lookup-btn:hover { box-shadow: 0 6px 20px rgba(249,115,22,0.4); transform: translateY(-1px); }
        .lookup-btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }
        .recent-searches { margin-top: 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .recent-tag { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 10px; padding: 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; color: var(--text-bright); font-weight: 600; }
        .recent-tag:hover { border-color: rgba(249,115,22,0.5); background: rgba(249,115,22,0.06); color: #ea580c; }
        .recent-close { font-size: 12px; color: #dc2626; font-weight: bold; }
        .lookup-error { width: 100%; max-width: 820px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px; font-size: 13.5px; font-weight: 600; }
        .stats-container { width: 100%; max-width: 820px; margin-bottom: 24px; }
        .stats-section-title { font-family: var(--font-heading); font-size: 16.5px; font-weight: 700; margin-bottom: 12px; color: var(--text-bright); display: flex; align-items: center; gap: 8px; letter-spacing: -0.2px; }
        .stats-cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; width: 100%; }
        .stats-cards-grid > :first-child { grid-column: 1 / -1; }
        .stat-card-item { border-radius: 14px; padding: 16px; border: 1.5px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; min-height: 105px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); background: var(--bg-card); transition: all 0.2s ease; width: 100%; box-sizing: border-box; }
        .stat-card-item.total { background: linear-gradient(135deg, rgba(219,234,254,0.6) 0%, var(--bg-card) 100%); border-color: #93c5fd; }
        .stat-card-item.pending { background: linear-gradient(135deg, rgba(254,243,199,0.6) 0%, var(--bg-card) 100%); border-color: #fcd34d; }
        .stat-card-item.completed { background: linear-gradient(135deg, rgba(209,250,229,0.6) 0%, var(--bg-card) 100%); border-color: #6ee7b7; }
        .stat-card-item.withdrawable { background: linear-gradient(135deg, rgba(255,237,213,0.6) 0%, var(--bg-card) 100%); border-color: #fdba74; }
        .stat-card-item.received { background: linear-gradient(135deg, rgba(243,232,255,0.6) 0%, var(--bg-card) 100%); border-color: #c084fc; }
        .stat-card-item.referral { background: linear-gradient(135deg, rgba(254,205,211,0.6) 0%, var(--bg-card) 100%); border-color: #fda4af; }
        html[data-theme="dark"] .stat-card-item.total, body.dark .stat-card-item.total { background: linear-gradient(145deg, rgba(59, 130, 246, 0.22), #0f172a 90%) !important; border-color: rgba(96, 165, 250, 0.65) !important; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25), inset 0 0 12px rgba(96, 165, 250, 0.12) !important; }
        html[data-theme="dark"] .stat-card-item.pending, body.dark .stat-card-item.pending { background: linear-gradient(145deg, rgba(245, 158, 11, 0.22), #0f172a 90%) !important; border-color: rgba(251, 191, 36, 0.65) !important; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.22), inset 0 0 12px rgba(251, 191, 36, 0.12) !important; }
        html[data-theme="dark"] .stat-card-item.completed, body.dark .stat-card-item.completed { background: linear-gradient(145deg, rgba(16, 185, 129, 0.22), #0f172a 90%) !important; border-color: rgba(52, 211, 153, 0.65) !important; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.22), inset 0 0 12px rgba(52, 211, 153, 0.12) !important; }
        html[data-theme="dark"] .stat-card-item.withdrawable, body.dark .stat-card-item.withdrawable { background: linear-gradient(145deg, rgba(249, 115, 22, 0.22), #0f172a 90%) !important; border-color: rgba(251, 146, 60, 0.65) !important; box-shadow: 0 4px 20px rgba(249, 115, 22, 0.25), inset 0 0 12px rgba(251, 146, 60, 0.12) !important; }
        html[data-theme="dark"] .stat-card-item.received, body.dark .stat-card-item.received { background: linear-gradient(145deg, rgba(168, 85, 247, 0.22), #0f172a 90%) !important; border-color: rgba(192, 132, 252, 0.65) !important; box-shadow: 0 4px 20px rgba(168, 85, 247, 0.25), inset 0 0 12px rgba(192, 132, 252, 0.12) !important; }
        html[data-theme="dark"] .stat-card-item.referral, body.dark .stat-card-item.referral { background: linear-gradient(145deg, rgba(244, 63, 94, 0.22), #0f172a 90%) !important; border-color: rgba(251, 113, 133, 0.65) !important; box-shadow: 0 4px 20px rgba(244, 63, 94, 0.22), inset 0 0 12px rgba(251, 113, 133, 0.12) !important; }
        .stat-card-item.total .stat-card-value { color: #2563eb; }
        .stat-card-item.pending .stat-card-value { color: #d97706; }
        .stat-card-item.completed .stat-card-value { color: #059669; }
        .stat-card-item.withdrawable .stat-card-value { color: #ea580c; }
        .stat-card-item.received .stat-card-value { color: #9333ea; }
        .stat-card-item.referral .stat-card-value { color: #e11d48; }
        html[data-theme="dark"] .stat-card-item.total .stat-card-value, body.dark .stat-card-item.total .stat-card-value { color: #60a5fa !important; text-shadow: 0 0 12px rgba(96, 165, 250, 0.4); }
        html[data-theme="dark"] .stat-card-item.pending .stat-card-value, body.dark .stat-card-item.pending .stat-card-value { color: #fbbf24 !important; text-shadow: 0 0 12px rgba(251, 191, 36, 0.4); }
        html[data-theme="dark"] .stat-card-item.completed .stat-card-value, body.dark .stat-card-item.completed .stat-card-value { color: #34d399 !important; text-shadow: 0 0 12px rgba(52, 211, 153, 0.4); }
        html[data-theme="dark"] .stat-card-item.withdrawable .stat-card-value, body.dark .stat-card-item.withdrawable .stat-card-value { color: #fb923c !important; text-shadow: 0 0 12px rgba(251, 146, 60, 0.4); }
        html[data-theme="dark"] .stat-card-item.received .stat-card-value, body.dark .stat-card-item.received .stat-card-value { color: #c084fc !important; text-shadow: 0 0 12px rgba(192, 132, 252, 0.4); }
        html[data-theme="dark"] .stat-card-item.referral .stat-card-value, body.dark .stat-card-item.referral .stat-card-value { color: #fb7185 !important; text-shadow: 0 0 12px rgba(251, 113, 133, 0.4); }
        .stat-card-label { font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; font-weight: 600; letter-spacing: 0.5px; }
        .stat-card-sub { font-size: 11px; color: var(--text-muted); opacity: 0.85; margin-bottom: 6px; line-height: 1.3; }
        .stat-card-value { font-family: var(--font-heading); font-size: 23px; font-weight: 700; color: var(--text-bright); letter-spacing: -0.3px; }
        .stat-card-value.primary { color: #2563eb; }
        .orders-container { width: 100%; max-width: 820px; }
        .order-card-item { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
        .order-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12.5px; color: var(--text-muted); font-weight: 500; }
        .order-id-badge { font-family: monospace; font-weight: 650; color: #ea580c; font-size: 12.5px; }
        .order-card-title { font-size: 14px; font-weight: 550; color: var(--text-bright); margin-bottom: 10px; line-height: 1.45; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .order-card-commission-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 10px; }
        .order-commission-label { font-size: 12.5px; color: var(--text-muted); font-weight: 500; }
        .order-commission-val { font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: #047857; }
        .lookup-spinner { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: lookup-spin 1s linear infinite; }
        @keyframes lookup-spin { to { transform: rotate(360deg); } }
        .lookup-banner-section { position: relative; width: 100%; max-width: 820px; margin: 28px 0 8px; display: flex; flex-direction: column; align-items: center; z-index: 2; }
        .lookup-banner-img-wrap { position: relative; width: 260px; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.1); border: 1px solid var(--border-color); animation: banner-float 4s ease-in-out infinite; }
        .lookup-banner-img-wrap img { width: 100%; display: block; }
        .lookup-banner-close { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        @keyframes banner-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .pin-digit-dots { display: flex; justify-content: center; gap: 8px; margin: 12px 0; }
        .pin-box-item { width: 44px; height: 50px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-main); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: var(--text-bright); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; user-select: none; }
        .pin-box-item.filled { border-color: #ea580c; background: rgba(249, 115, 22, 0.08); box-shadow: 0 0 10px rgba(234, 88, 12, 0.2); color: #ea580c; }
        .pin-box-item.active { border-color: #f97316; box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2); }
        .pin-dot-bullet { width: 12px; height: 12px; border-radius: 50%; background: #ea580c; box-shadow: 0 0 6px rgba(234, 88, 12, 0.5); }
        .pin-hidden-input { position: absolute; opacity: 0; pointer-events: auto; width: calc(100% - 50px); height: 100%; top: 0; left: 0; z-index: 2; }
        @media (max-width: 640px) { 
          .lookup-page-container { padding: 8px 4px !important; }
          .lookup-header, .lookup-card, .stats-container, .orders-container, .lookup-banner-section, .lookup-error { width: 100% !important; max-width: 100% !important; }
          .stats-cards-grid { grid-template-columns: 1fr !important; gap: 10px !important; } 
          .stats-cards-grid > * { grid-column: 1 / -1 !important; width: 100% !important; min-height: auto !important; } 
          .lookup-card { padding: 16px 12px !important; } 
          .stat-card-value { font-size: 22px; } 
          .lookup-banner-img-wrap { width: 100%; max-width: 280px; } 
        }
      `}} />



      {/* Search Panel */}
      <div className="lookup-card">
        <h2 className="lookup-title">
          <i className="fa-thin fa-magnifying-glass" style={{ marginRight: '8px' }}></i> Tra Cứu Đơn Hàng Shopee & TikTok Shop
        </h2>
        <p className="lookup-subtitle">Nhập mã đơn hàng Shopee hoặc TikTok Shop để kiểm tra trạng thái và hoa hồng</p>

        <div className="lookup-input-group">
          <label className="lookup-label">Mã đơn hàng (Shopee / TikTok Shop)</label>
          <input type="text" className="lookup-input" value={lookupQuery} onChange={e => setLookupQuery(e.target.value)}
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
              <span className="bank-card-title-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-building-columns" style={{ color: 'var(--text-muted)', fontSize: '15px' }}></i>
                <span>Thông Tin Ngân Hàng Nhận Tiền</span>
              </span>
              {!isEditingBank && (
                <button className="bank-edit-btn"
                  onClick={handleStartEditBank}>
                  <i className="fa-regular fa-pen-to-square" style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
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
                  <button className="lookup-admin-link" style={{ padding: '6px 14px', background: 'var(--bg-main)', color: 'var(--text-muted)' }} onClick={() => { setIsEditingBank(false); setVerifiedPin(''); setBankSaveError(''); }} disabled={bankSaveLoading}>Hủy</button>
                  <button className="lookup-btn" style={{ width: 'auto', padding: '6px 20px', fontSize: '13px' }} onClick={handleSaveBank} disabled={bankSaveLoading}>
                    {bankSaveLoading ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                marginTop: '14px',
                background: 'var(--bg-main)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(2, 132, 199, 0.12)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    flexShrink: 0
                  }}>
                    <i className="fa-solid fa-building-columns"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      NGÂN HÀNG THỤ HƯỞNG
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-bright)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{lookupResult.bankName || 'Chưa thiết lập'}</span>
                      {lookupResult.accountNumber && (
                        <>
                          <span style={{ color: 'var(--border-color)' }}>•</span>
                          <span style={{ fontFamily: 'monospace', color: '#0284c7', letterSpacing: '1px' }}>
                            {maskAccountNumber(lookupResult.accountNumber)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Referral Card (Đặt ở dưới phần Thông tin ngân hàng, trên Thống kê hoa hồng) */}
          {lookupResult.referralCode && (
            <div className="lookup-card referral-card-section" style={{
              marginBottom: '24px',
              padding: referralExpanded ? '20px' : '14px 18px',
              background: 'linear-gradient(145deg, rgba(249, 115, 22, 0.05) 0%, var(--bg-card) 100%)',
              border: '1.5px solid rgba(249, 115, 22, 0.35)',
              boxShadow: '0 4px 16px -2px rgba(249, 115, 22, 0.08)',
              transition: 'all 0.25s ease'
            }}>
              {/* Header: Click để Mở ra / Thu gọn */}
              <div 
                onClick={() => setReferralExpanded(!referralExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexWrap: 'nowrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                  <span style={{ fontSize: '18px' }}>🎁</span>
                  <strong style={{ fontSize: '14.5px', color: 'var(--text-bright)', letterSpacing: '-0.2px' }}>
                    Giới Thiệu Bạn Bè
                  </strong>
                  <span style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '20px'
                  }}>
                    +10.000đ / người
                  </span>
                  {!referralExpanded && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      • Mã: <strong style={{ color: '#ea580c', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{lookupResult.referralCode ? lookupResult.referralCode.replace(/^GT/i, '') : ''}</strong>
                    </span>
                  )}
                </div>

                <button 
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: referralExpanded ? 'var(--bg-main)' : 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid ' + (referralExpanded ? 'var(--border-color)' : 'rgba(249, 115, 22, 0.4)'),
                    borderRadius: '20px',
                    padding: '5px 12px',
                    color: '#ea580c',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span>{referralExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                  <i className={`fa-solid fa-chevron-${referralExpanded ? 'up' : 'down'}`} style={{ fontSize: '11px' }}></i>
                </button>
              </div>

              {/* Nội dung chi tiết: Chỉ hiện khi referralExpanded === true */}
              {referralExpanded && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--border-color)' }}>
                  {/* Mã giới thiệu & Copy box (Không xuống dòng trên mobile & desktop) */}
                  <div style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      MÃ GIỚI THIỆU CỦA BẠN
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div 
                        onClick={() => {
                          const code = lookupResult.referralCode ? lookupResult.referralCode.replace(/^GT/i, '') : '';
                          navigator.clipboard.writeText(code);
                          showToast(`Đã sao chép mã: ${code}`, 'success');
                        }}
                        title="Chạm để sao chép mã"
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '24px',
                          fontWeight: '900',
                          letterSpacing: '1px',
                          color: '#ea580c',
                          lineHeight: '1.2',
                          cursor: 'pointer',
                          userSelect: 'all',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {lookupResult.referralCode ? lookupResult.referralCode.replace(/^GT/i, '') : ''}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const code = lookupResult.referralCode ? lookupResult.referralCode.replace(/^GT/i, '') : '';
                          navigator.clipboard.writeText(code);
                          showToast(`Đã sao chép mã giới thiệu: ${code}`, 'success');
                        }}
                        className="lookup-btn"
                        style={{
                          height: '38px',
                          width: 'auto',
                          fontSize: '13px',
                          padding: '0 16px',
                          fontWeight: '700',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box',
                          flexShrink: 0
                        }}
                        title="Sao chép mã giới thiệu"
                      >
                        <i className="fa-regular fa-copy"></i>
                        <span>Copy Mã</span>
                      </button>
                    </div>
                  </div>

                  {/* Hướng dẫn & Quy tắc */}
                  <div style={{
                    background: 'rgba(249, 115, 22, 0.04)',
                    borderLeft: '3px solid #f97316',
                    borderRadius: '0 8px 8px 0',
                    padding: '12px 14px',
                    fontSize: '12.5px',
                    lineHeight: '1.6',
                    color: 'var(--text-main)',
                    marginBottom: '14px'
                  }}>
                    <div style={{ fontWeight: '700', color: '#ea580c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-circle-info" style={{ fontSize: '13px' }}></i>
                      <span>Hướng dẫn & Quy tắc nhận thưởng:</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <i className="fa-solid fa-paper-plane" style={{ color: '#ea580c', width: '16px', textAlign: 'center', flexShrink: 0, marginTop: '3px', fontSize: '12px' }}></i>
                      <span>Gửi mã cho bạn bè, người được giới thiệu nhập mã trên Web hoặc gõ vào nhóm Zalo: <strong style={{ color: '#ea580c', fontFamily: 'monospace' }}>/gt {lookupResult.referralCode ? lookupResult.referralCode.replace(/^GT/i, '') : ''}</strong> để lưu liên kết.</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <i className="fa-solid fa-circle-exclamation" style={{ color: '#ef4444', width: '16px', textAlign: 'center', flexShrink: 0, marginTop: '3px', fontSize: '12px' }}></i>
                      <span><strong style={{ color: '#ef4444' }}>Quy tắc:</strong> Người được giới thiệu <u>chỉ được phép nhập mã người giới thiệu 1 lần duy nhất trong đời</u>.</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <i className="fa-solid fa-gift" style={{ color: '#ea580c', width: '16px', textAlign: 'center', flexShrink: 0, marginTop: '3px', fontSize: '12px' }}></i>
                      <span><strong>Điều kiện nhận thưởng:</strong> Khi bạn bè tích lũy hoa hồng hoàn thành đạt từ <strong>50.000đ</strong> trở lên, bạn sẽ nhận ngay <strong>+10.000đ</strong> cộng thẳng vào số dư ví rút tiền!</span>
                    </div>
                  </div>

                  {/* Thống kê giới thiệu */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))',
                    gap: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 4px' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-users" style={{ fontSize: '10px' }}></i>
                        <span>ĐÃ GIỚI THIỆU</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-bright)', marginTop: '2px' }}>
                        {lookupResult.wallet?.referralCount || 0} bạn
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 4px' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-circle-check" style={{ fontSize: '10px', color: '#059669' }}></i>
                        <span>ĐẠT MỐC 50K</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
                        {lookupResult.wallet?.completedReferralCount || 0} bạn
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 4px' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-hourglass-half" style={{ fontSize: '10px', color: '#d97706' }}></i>
                        <span>ĐANG CHỜ MỐC</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#d97706', marginTop: '2px' }}>
                        {Math.max(0, (lookupResult.wallet?.referralCount || 0) - (lookupResult.wallet?.completedReferralCount || 0))} bạn
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 4px' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <i className="fa-solid fa-coins" style={{ fontSize: '10px', color: '#ea580c' }}></i>
                        <span>TIỀN THƯỞNG</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#ea580c', marginTop: '2px' }}>
                        {formatMoney(lookupResult.wallet?.referralBonus || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Thông tin người đã giới thiệu bạn (nếu có) */}
                  {(lookupResult.hasReferrer || lookupResult.wallet?.hasReferrer) && (
                    <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-handshake" style={{ color: '#ea580c', fontSize: '12px' }}></i>
                      <span>Bạn đã được giới thiệu bởi thành viên: <strong style={{ color: 'var(--text-bright)' }}>{lookupResult.referrerName || lookupResult.wallet?.referrerName || 'Thành viên giới thiệu'}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Wallet Stats */}
          <div className="stats-container">
            <h3 className="stats-section-title">💰 Thống Kê Hoa Hồng của: <span style={{ color: '#ea580c' }}>{lookupResult.zaloName}</span></h3>
            
            <div className="stats-cards-grid">
              {/* Thẻ 0: Tổng tích lũy (Hoàn thành + Chờ) - Chiếm full hàng ngang */}
              <div className="stat-card-item total" style={{ gridColumn: '1 / -1' }}>
                <span className="stat-card-label">🌟 TỔNG TÍCH LŨY (HOÀN THÀNH + CHỜ)</span>
                <span className="stat-card-sub">(Toàn bộ hoa hồng tích lũy)</span>
                <span className="stat-card-value primary">
                  {formatMoney((lookupResult.wallet.pendingCommission || 0) + (lookupResult.wallet.rawCompletedCommission != null ? lookupResult.wallet.rawCompletedCommission : (lookupResult.wallet.completedCommission || 0)))}
                </span>
              </div>

              <div className="stat-card-item pending">
                <span className="stat-card-label">⏳ ĐANG XỬ LÝ</span>
                <span className="stat-card-sub">(Đang vận chuyển hoặc chưa ấn nhận hàng)</span>
                <span className="stat-card-value">
                  {formatMoney(lookupResult.wallet.pendingCommission)}
                </span>
              </div>

              <div className="stat-card-item completed">
                <span className="stat-card-label">📦 ĐÃ HOÀN THÀNH</span>
                <span className="stat-card-sub">(Hoàn thành • Chưa đủ 3 ngày để rút)</span>
                <span className="stat-card-value">
                  {formatMoney(lookupResult.wallet.completedNotYetWithdrawable != null ? lookupResult.wallet.completedNotYetWithdrawable : lookupResult.wallet.completedCommission)}
                </span>
              </div>

              <div className="stat-card-item withdrawable">
                <span className="stat-card-label">💵 RÚT TIỀN HOA HỒNG KHẢ DỤNG</span>
                {lookupResult.wallet.pendingWithdrawn > 0 ? (
                  <span className="stat-card-sub" style={{ color: '#d97706', fontWeight: 'bold' }}>
                    (Đang chờ duyệt rút: {formatMoney(lookupResult.wallet.pendingWithdrawn)})
                  </span>
                ) : (
                  <span className="stat-card-sub">
                    (Sau 3 ngày • Đã trừ thuế & chia 8-2{lookupResult.wallet?.referralBonus > 0 ? ` • Gồm +${formatMoney(lookupResult.wallet.referralBonus)} thưởng GT` : ''})
                  </span>
                )}
                <span className="stat-card-value">
                  {formatMoney(lookupResult.wallet.withdrawableCommission)}
                </span>
              </div>

              <div className="stat-card-item received">
                <span className="stat-card-label">🏦 ĐÃ NHẬN (ĐÃ THANH TOÁN)</span>
                <span className="stat-card-sub">(Tổng tiền đã rút về tài khoản bank)</span>
                <span className="stat-card-value">
                  {formatMoney(lookupResult.wallet.receivedCommission)}
                </span>
              </div>

              {lookupResult.wallet?.referralBonus > 0 && (
                <div className="stat-card-item referral" style={{ gridColumn: 'span 2' }}>
                  <span className="stat-card-label">🎁 THƯỞNG GIỚI THIỆU BẠN BÈ</span>
                  <span className="stat-card-sub">(Đã hoàn thành mốc 50k • Đã cộng thẳng vào số dư khả dụng)</span>
                  <span className="stat-card-value">
                    +{formatMoney(lookupResult.wallet.referralBonus)}
                  </span>
                </div>
              )}
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg viewBox="0 0 109.59 122.88" style={{ width: '13px', height: '13px', fill: 'currentColor', flexShrink: 0 }}>
                          <path d="M74.98,91.98C76.15,82.36,69.96,76.22,53.6,71c-7.92-2.7-11.66-6.24-11.57-11.12 c0.33-5.4,5.36-9.34,12.04-9.47c4.63,0.09,9.77,1.22,14.76,4.56c0.59,0.37,1.01,0.32,1.35-0.2c0.46-0.74,1.61-2.53,2-3.17 c0.26-0.42,0.31-0.96-0.35-1.44c-0.95-0.7-3.6-2.13-5.03-2.72c-3.88-1.62-8.23-2.64-12.86-2.63c-9.77,0.04-17.47,6.22-18.12,14.47 c-0.42,5.95,2.53,10.79,8.86,14.47c1.34,0.78,8.6,3.67,11.49,4.57c9.08,2.83,13.8,7.9,12.69,13.81c-1.01,5.36-6.65,8.83-14.43,8.93 c-6.17-0.24-11.71-2.75-16.02-6.1c-0.11-0.08-0.65-0.5-0.72-0.56c-0.53-0.42-1.11-0.39-1.47,0.15c-0.26,0.4-1.92,2.8-2.34,3.43 c-0.39,0.55-0.18,0.86,0.23,1.2c1.8,1.5,4.18,3.14,5.81,3.97c4.47,2.28,9.32,3.53,14.48,3.72c3.32,0.22,7.5-0.49,10.63-1.81 C70.63,102.67,74.25,97.92,74.98,91.98L74.98,91.98z M54.79,7.18c-10.59,0-19.22,9.98-19.62,22.47h39.25 C74.01,17.16,65.38,7.18,54.79,7.18z M94.99,122.88l-0.41,0l-80.82-0.01h0c-5.5-0.21-9.54-4.66-10.09-10.19l-0.05-1 l-3.61-79.5v0C0,32.12,0,32.06,0,32c0-1.28,1.03-2.33,2.3-2.35l0,0h25.48C28.41,13.15,40.26,0,54.79,0s26.39,13.15,27.01,29.65 h25.4h0.04c1.3,0,2.35,1.05,2.35,2.35c0,0.04,0,0.08,0,0.12v0l-3.96,79.81l-0.04,0.68C105.12,118.21,100.59,122.73,94.99,122.88 L94.99,122.88z" />
                        </svg>
                        <span>Shopee ({lookupResult.orders.filter(o => !o.platform || o.platform === 'Shopee').length})</span>
                      </span>
                    </button>
                    <button 
                      className={`lookup-tab ${platformFilter === 'TikTok Shop' ? 'active-tiktok' : ''}`}
                      style={platformFilter === 'TikTok Shop' ? { background: '#000000', color: '#ffffff', borderColor: '#000000', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' } : {}}
                      onClick={() => setPlatformFilter('TikTok Shop')}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
              <div className="orders-grid-list">
                {searchedOrders.map(o => {
                  const s = (o.status || '').toLowerCase();
                  const isCompleted =
                    s.includes('hoàn thành') ||
                    s.includes('thành công') ||
                    s.includes('completed') ||
                    s.includes('success') ||
                    s.includes('đã chốt') ||
                    s.includes('đã hoàn');
                  const isCancelled =
                    s.includes('hủy') ||
                    s.includes('cancel') ||
                    s.includes('refund') ||
                    s.includes('từ chối');
                  
                  const plat = (o.platform || '').toUpperCase();
                  const platBadge = (plat === 'TIKTOK' || plat.includes('TIKTOK'))
                    ? { label: 'TikTok', color: '#0f172a', bg: 'rgba(15, 23, 42, 0.08)', className: 'platform-badge-tiktok', icon: 'fa-brands fa-tiktok' }
                    : (plat === 'LAZADA' || plat.includes('LAZADA'))
                    ? { label: 'Lazada', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', icon: 'fa-solid fa-bag-shopping' }
                    : (plat === 'SHOPEE_FOOD' || plat.includes('FOOD'))
                    ? { label: 'ShopeeFood', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.25)', icon: 'fa-solid fa-utensils' }
                    : { label: 'Shopee', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', icon: 'fa-solid fa-bag-shopping' };

                  const dateInfo = parseDateInfo(o);
                  const shortOrderDate = getShortOrderDate(o);
                  const commissionVal = Math.round(Number(o.commission || o.finalCommission || o.userFinalCommission || 0));

                  // Trạng thái hiển thị viên thuốc dạng: • Đang xử lý / • Đã hoàn thành / • Đã hủy
                  let stBadge = {
                    text: 'Đang xử lý',
                    bg: '#fef3c7',
                    color: '#b45309',
                    dotColor: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.25)'
                  };

                  if (isCompleted) {
                    stBadge = {
                      text: 'Đã hoàn thành',
                      bg: '#dcfce7',
                      color: '#15803d',
                      dotColor: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.25)'
                    };
                  } else if (isCancelled) {
                    stBadge = {
                      text: 'Đã hủy',
                      bg: '#fee2e2',
                      color: '#b91c1c',
                      dotColor: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)'
                    };
                  }

                  return (
                    <div key={o.id} className="order-card-modern">
                      {/* HÀNG 1 (HEADER): NỀN TẢNG + MÃ ĐƠN HÀNG ĐẦY ĐỦ + NÚT COPY & BADGE TRẠNG THÁI */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        {/* BÊN TRÁI: Icon sàn + Tên sàn + Mã đơn đầy đủ + Nút Copy */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', minWidth: 0 }}>
                          <i className={platBadge.icon || 'fa-solid fa-bag-shopping'} style={{ color: platBadge.color || '#ea580c', fontSize: '15px' }}></i>
                          <span style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--text-bright, #0f172a)' }}>
                            {platBadge.label || 'Shopee'}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              fontFamily: 'monospace, sans-serif',
                              color: '#64748b',
                              letterSpacing: '0.2px'
                            }}
                            title={o.orderId}
                          >
                            {o.orderId}
                          </span>
                          <CopyButton text={o.orderId} title="Copy mã đơn hàng" toastMessage={`Đã copy mã đơn: ${o.orderId}`} />
                        </div>

                        {/* BÊN PHẢI: Pill badge trạng thái có chấm tròn màu */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: stBadge.bg,
                            color: stBadge.color,
                            border: stBadge.border,
                            flexShrink: 0
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: stBadge.dotColor, display: 'inline-block' }}></span>
                          <span>{stBadge.text}</span>
                        </div>
                      </div>

                      {/* HÀNG 2 (BODY): ẢNH + TÊN SẢN PHẨM + NGÀY THÁNG RÚT GỌN GÓC PHẢI */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {o.imageUrl ? (
                          <img
                            src={o.imageUrl}
                            alt={o.productName || 'Ảnh sản phẩm'}
                            referrerPolicy="no-referrer"
                            style={{
                              width: '54px',
                              height: '54px',
                              objectFit: 'cover',
                              borderRadius: '12px',
                              border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                              flexShrink: 0,
                              background: 'var(--bg-main, #f8fafc)',
                              cursor: 'pointer'
                            }}
                            title="Bấm để xem ảnh gốc"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(o.imageUrl, '_blank', 'noopener,noreferrer');
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '12px',
                            background: 'var(--bg-main, #f8fafc)',
                            border: '1px solid var(--border-color, rgba(0,0,0,0.06))',
                            display: o.imageUrl ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted, #94a3b8)',
                            fontSize: '20px',
                            flexShrink: 0
                          }}
                        >
                          <i className={platBadge.icon || 'fa-solid fa-bag-shopping'} style={{ opacity: 0.65 }}></i>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="order-card-title"
                            title={o.productName}
                            style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: 'var(--text-bright, #0f172a)',
                              lineHeight: '1.4',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {o.productName || 'Sản phẩm mua sắm qua link tiếp thị'}
                          </div>
                        </div>

                        {shortOrderDate && (
                          <div
                            style={{ fontSize: '11.5px', fontWeight: '600', color: '#94a3b8', flexShrink: 0, marginLeft: '4px' }}
                            title={`Ngày đặt: ${shortOrderDate}`}
                          >
                            {shortOrderDate}
                          </div>
                        )}
                      </div>

                      {/* HÀNG 3 (FOOTER): Ô LỊCH NGÀY THÁNG BÊN TRÁI & HOA HỒNG BÊN PHẢI */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '6px' }}>
                        {/* BÊN TRÁI: Ô LỊCH THỜI GIAN & TEXT GHI NHẬN / ĐÃ HOÀN */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              border: `1.5px solid ${isCompleted ? '#bbf7d0' : isCancelled ? '#fecaca' : '#fed7aa'}`,
                              background: isCompleted ? '#f0fdf4' : isCancelled ? '#fef2f2' : '#fff7ed',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: '1',
                              flexShrink: 0
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: '900', color: isCompleted ? '#16a34a' : isCancelled ? '#dc2626' : '#ea580c' }}>
                              {dateInfo.day}
                            </span>
                            <span style={{ fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', color: isCompleted ? '#16a34a' : isCancelled ? '#dc2626' : '#ea580c', marginTop: '1px' }}>
                              {dateInfo.month}
                            </span>
                          </div>

                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-bright, #334155)' }}>
                            {dateInfo.labelText}
                          </span>
                        </div>

                        {/* BÊN PHẢI: LABEL HOA HỒNG (NHƯ CŨ) & SỐ TIỀN HOA HỒNG TO NỔI BẬT */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.4px', marginBottom: '1px' }}>
                            Hoa hồng
                          </div>
                          <div
                            style={{
                              fontSize: '15.5px',
                              fontWeight: '900',
                              fontFamily: 'monospace, sans-serif',
                              color: isCompleted ? '#059669' : isCancelled ? '#94a3b8' : '#ea580c',
                              letterSpacing: '-0.2px'
                            }}
                          >
                            {commissionVal > 0 ? `+${formatMoney(commissionVal)}` : '0đ'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  {pendingAction === 'UNLOCK_BANK' ? 'Xác Nhận PIN Để Xem & Sửa STK' : 'Xác Nhận Mã PIN Rút Tiền'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px', padding: '0 4px' }}>
                  Nhập mã PIN 6 số bảo mật của <strong style={{ color: '#ea580c' }}>{lookupResult?.zaloName || 'sếp'}</strong> để {
                    pendingAction === 'UNLOCK_BANK' ? 'mở khóa xem chi tiết và sửa tài khoản ngân hàng' :
                    pendingAction === 'BANK' ? 'cập nhật tài khoản ngân hàng' : 
                    'gửi yêu cầu rút tiền'
                  }.
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
                    {(pinLoading || bankSaveLoading || payoutSaveLoading) ? (<><div className="lookup-spinner"></div>Đang xác nhận...</>) : (
                      pendingAction === 'UNLOCK_BANK' ? '✓ Xác nhận & Mở khóa STK' : '✓ Xác nhận giao dịch'
                    )}
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

    </div>
  );
}
