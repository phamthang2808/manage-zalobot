import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export default function WithdrawView() {
  const { API_URL_ROOT, user, setView, showToast } = useApp();
  const [wallet, setWallet] = useState({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    pendingWithdraw: 0,
    bankName: '',
    accountNumber: '',
    accountName: '',
    zaloId: ''
  });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWalletAndPayouts = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const [wRes, pRes] = await Promise.all([
        fetch(`${API_URL_ROOT}/api/user/wallet`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        }),
        fetch(`${API_URL_ROOT}/api/user/payouts`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        })
      ]);

      const wData = await wRes.json();
      const pData = await pRes.json();

      if (wRes.ok && wData.data) {
        setWallet(wData.data);
      }
      if (pRes.ok && pData.data) {
        setPayouts(pData.data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải thông tin ví', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletAndPayouts();
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amount = parseFloat(amountInput.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount < 50000) {
      showToast('Số tiền rút tối thiểu là 50,000 đ', 'warning');
      return;
    }

    if (amount > wallet.balance) {
      showToast(`Số dư khả dụng (${formatMoney(wallet.balance)}) không đủ!`, 'error');
      return;
    }

    if (!wallet.bankName || !wallet.accountNumber) {
      showToast('Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền!', 'warning');
      setView('account');
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          bankName: wallet.bankName,
          accountNumber: wallet.accountNumber,
          accountName: wallet.accountName
        }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi gửi yêu cầu rút tiền');

      showToast(resData.message || 'Đã gửi yêu cầu rút tiền thành công! 🎉', 'success');
      setAmountInput('');
      fetchWalletAndPayouts();
    } catch (err) {
      showToast(err.message || 'Lỗi gửi yêu cầu rút tiền', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="withdraw-view-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Wallet Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
          borderRadius: '18px',
          padding: '20px 22px',
          color: '#fff',
          boxShadow: '0 8px 20px rgba(234, 88, 12, 0.25)'
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Số Dư Khả Dụng (Có Thể Rút)
          </div>
          <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>
            {formatMoney(wallet.balance)}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '6px' }}>
            Hoa hồng từ các đơn đã hoàn thành
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card, #fff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '18px',
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Tổng Hoa Hồng Đã Kiếm
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-bright, #0f172a)' }}>
            {formatMoney(wallet.totalEarned)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '6px' }}>
            Tổng tích lũy hợp nhất (Web + Zalo)
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card, #fff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '18px',
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Đã Thanh Toán Thành Công
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669' }}>
            {formatMoney(wallet.totalWithdrawn)}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700', marginTop: '6px' }}>
            Đã chuyển về tài khoản ngân hàng
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card, #fff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '18px',
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Đang Chờ Admin Chuyển
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#d97706' }}>
            {formatMoney(wallet.pendingWithdraw)}
          </div>
          <div style={{ fontSize: '12px', color: '#d97706', fontWeight: '700', marginTop: '6px' }}>
            Lệnh rút đang được xử lý
          </div>
        </div>
      </div>

      {/* Request Payout Form */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-bright, #0f172a)' }}>
          💳 Tạo Lệnh Rút Tiền
        </h2>

        {/* Bank info summary */}
        {wallet.bankName && wallet.accountNumber ? (
          <div style={{
            background: 'var(--bg-main, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted, #64748b)' }}>TÀI KHOẢN NHẬN TIỀN</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-bright, #0f172a)', marginTop: '2px' }}>
                {wallet.bankName} — <span style={{ fontFamily: 'monospace' }}>{wallet.accountNumber}</span>
                {wallet.accountName && ` (${wallet.accountName})`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setView('account')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Đổi tài khoản ngân hàng
            </button>
          </div>
        ) : (
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #fef3c7',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <span style={{ fontSize: '13px', color: '#b45309', fontWeight: '700' }}>
              ⚠️ Bạn chưa cập nhật số tài khoản ngân hàng để nhận tiền!
            </span>
            <button
              type="button"
              onClick={() => setView('account')}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#d97706',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              Cập nhật ngay
            </button>
          </div>
        )}

        <form onSubmit={handleRequestPayout}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: 'var(--text-bright, #0f172a)', marginBottom: '8px' }}>
              Số tiền muốn rút (VNĐ, tối thiểu 50,000 đ):
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                min="50000"
                step="1000"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Nhập số tiền cần rút..."
                style={{
                  flex: '1',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-bright, #0f172a)',
                  fontSize: '15px',
                  fontWeight: '700',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setAmountInput(String(Math.floor(wallet.balance)))}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1px solid #fed7aa',
                  background: '#fff7ed',
                  color: '#ea580c',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Rút tất cả
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || wallet.balance < 50000 || !amountInput}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              background: submitting || wallet.balance < 50000 || !amountInput ? '#94a3b8' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '800',
              cursor: submitting || wallet.balance < 50000 || !amountInput ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
            }}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Đang gửi yêu cầu...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i>
                <span>Gửi Yêu Cầu Rút Tiền</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Payouts History Table */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright, #0f172a)' }}>
            📜 Lịch Sử Yêu Cầu Rút Tiền
          </h2>
        </div>

        {payouts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
            <p style={{ margin: 0, fontSize: '13px' }}>Bạn chưa tạo lệnh rút tiền nào.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1.5px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Mã lệnh</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Số tiền</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Tài khoản nhận</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>Thời gian</th>
                  <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => {
                  const isCompleted = p.status === 'COMPLETED';
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '12.5px', fontWeight: '700' }}>
                        #{p.id}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '900', color: '#ea580c' }}>
                        {formatMoney(p.amount)}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600' }}>
                        {p.bankName} - {p.accountNumber} {p.accountName ? `(${p.accountName})` : ''}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          background: isCompleted ? '#ecfdf5' : '#fffbeb',
                          color: isCompleted ? '#059669' : '#d97706',
                          border: `1px solid ${isCompleted ? '#a7f3d0' : '#fde68a'}`
                        }}>
                          {isCompleted ? '✓ Đã chuyển' : '⏳ Chờ duyệt'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
