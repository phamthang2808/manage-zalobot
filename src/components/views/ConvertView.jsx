import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';

export default function ConvertView() {
  const { API_URL_ROOT, user, showToast, setView } = useApp();
  const [inputText, setInputText] = useState('');
  const [activePlatform, setActivePlatform] = useState('shopee'); // 'shopee' | 'tiktok' | 'lazada'
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      showToast('Vui lòng dán ít nhất một liên kết sản phẩm!', 'warning');
      return;
    }

    const lines = inputText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    setConverting(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/user/convert-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ links: lines }),
        credentials: 'include'
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Lỗi chuyển đổi liên kết');
      }

      setResults(resData.data || []);
      showToast(`Chuyển đổi thành công ${resData.data?.length || 0} liên kết! 🎉`, 'success');
    } catch (err) {
      showToast(err.message || 'Lỗi server khi chuyển đổi link', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handleCopy = (link, idx) => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedIndex(idx);
      showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopiedIndex(null), 2500);
    }).catch(() => {
      showToast('Không thể sao chép liên kết!', 'error');
    });
  };

  return (
    <div className="convert-view-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '20px',
        padding: '28px 24px',
        color: '#fff',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '14px', backdropFilter: 'blur(8px)' }}>
          <i className="fa-solid fa-bolt" style={{ color: '#f59e0b' }}></i>
          <span>Chuyển Đổi Link Tiếp Thị Nhanh</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 10px 0', lineHeight: '1.3' }}>
          Tạo Link Tiếp Thị & Tích Lũy Hoa Hồng Tự Động
        </h1>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.5', maxWidth: '650px' }}>
          Dán bất kỳ liên kết sản phẩm nào từ <b>Shopee</b>, <b>TikTok Shop</b> hoặc <b>Lazada</b> để tạo link rút gọn gắn mã định danh cá nhân của bạn. Mọi đơn mua phát sinh sẽ được ghi nhận hoàn tiền vào tài khoản.
        </p>

        {/* Platform Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => setActivePlatform('shopee')}
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: activePlatform === 'shopee' ? '2px solid #ea580c' : '1px solid rgba(255,255,255,0.15)',
              background: activePlatform === 'shopee' ? '#fff' : 'rgba(255,255,255,0.06)',
              color: activePlatform === 'shopee' ? '#0f172a' : '#fff',
              fontWeight: activePlatform === 'shopee' ? '800' : '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-bag-shopping" style={{ color: activePlatform === 'shopee' ? '#ea580c' : '#fb923c' }}></i>
            <span>Shopee</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePlatform('tiktok')}
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: activePlatform === 'tiktok' ? '2px solid #000' : '1px solid rgba(255,255,255,0.15)',
              background: activePlatform === 'tiktok' ? '#fff' : 'rgba(255,255,255,0.06)',
              color: activePlatform === 'tiktok' ? '#0f172a' : '#fff',
              fontWeight: activePlatform === 'tiktok' ? '800' : '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-brands fa-tiktok" style={{ color: activePlatform === 'tiktok' ? '#000' : '#e2e8f0' }}></i>
            <span>TikTok Shop</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePlatform('lazada')}
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: activePlatform === 'lazada' ? '2px solid #2563eb' : '1px solid rgba(255,255,255,0.15)',
              background: activePlatform === 'lazada' ? '#fff' : 'rgba(255,255,255,0.06)',
              color: activePlatform === 'lazada' ? '#0f172a' : '#fff',
              fontWeight: activePlatform === 'lazada' ? '800' : '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fa-solid fa-store" style={{ color: activePlatform === 'lazada' ? '#2563eb' : '#60a5fa' }}></i>
            <span>Lazada</span>
          </button>
        </div>
      </div>

      {/* Input Box Card */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <label style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
            🔗 Dán link sản phẩm (hỗ trợ nhiều link, mỗi dòng 1 link):
          </label>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>
            ID của bạn: <code style={{ color: '#ea580c', fontWeight: '800' }}>u{user?.id || 'guest'}</code>
          </span>
        </div>

        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ví dụ:\nhttps://shopee.vn/product/123/456...\nhttps://vt.tiktok.com/ZSxxx...\nhttps://s.lazada.vn/s.xxx...`}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1.5px solid var(--border-color, #cbd5e1)',
            background: 'var(--bg-main, #f8fafc)',
            color: 'var(--text-bright, #0f172a)',
            fontSize: '13.5px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setInputText('')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'transparent',
              color: 'var(--text-muted, #64748b)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Xóa nội dung
          </button>

          <button
            type="button"
            onClick={handleConvert}
            disabled={converting || !inputText.trim()}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              background: converting || !inputText.trim() ? '#94a3b8' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '800',
              cursor: converting || !inputText.trim() ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
            }}
          >
            {converting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Đang xử lý link...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Chuyển Đổi Link Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div style={{
          background: 'var(--bg-card, #fff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text-bright, #0f172a)' }}>
            ✨ Kết Quả Chuyển Đổi ({results.length} link)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {results.map((res, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px 18px',
                  borderRadius: '14px',
                  border: res.success ? '1px solid #fed7aa' : '1px solid #fecdd3',
                  background: res.success ? 'var(--bg-main, #fffaf5)' : '#fff1f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ flex: '1', minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: res.platform === 'SHOPEE' ? '#ffedd5' : res.platform === 'TIKTOK' ? '#f1f5f9' : '#dbeafe',
                      color: res.platform === 'SHOPEE' ? '#ea580c' : res.platform === 'TIKTOK' ? '#0f172a' : '#2563eb'
                    }}>
                      {res.platform || 'UNKNOWN'}
                    </span>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
                      {res.productName || 'Sản phẩm tiếp thị'}
                    </span>
                  </div>

                  {res.affiliateLink ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {res.affiliateLink}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#e11d48', fontWeight: '600' }}>
                      ⚠️ {res.error || 'Không thể tạo link'}
                    </div>
                  )}

                  {res.commissionRate != null && (
                    <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', marginTop: '4px' }}>
                      Hoa hồng ước tính: ~{(res.commissionRate * 100).toFixed(1)}% {res.price ? `(${formatMoney(res.price * res.commissionRate)})` : ''}
                    </div>
                  )}
                </div>

                {res.affiliateLink && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopy(res.affiliateLink, idx)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1px solid #fdba74',
                        background: copiedIndex === idx ? '#16a34a' : '#ea580c',
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <i className={copiedIndex === idx ? "fa-solid fa-check" : "fa-solid fa-copy"}></i>
                      <span>{copiedIndex === idx ? 'Đã chép' : 'Sao chép'}</span>
                    </button>

                    <a
                      href={res.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color, #cbd5e1)',
                        background: 'var(--bg-card, #fff)',
                        color: 'var(--text-bright, #0f172a)',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Mua ngay</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
