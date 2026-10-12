import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';

export default function ConvertView() {
  const { API_URL_ROOT, user, showToast } = useApp();
  const [inputText, setInputText] = useState('');
  const [activePlatform, setActivePlatform] = useState('ALL');
  const [converting, setConverting] = useState(false);
  const [results, setResults] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Lịch sử chuyển đổi (tương tự Mai Lan)
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isTipsOpen, setIsTipsOpen] = useState(true);
  const [historyFilterPlatform, setHistoryFilterPlatform] = useState('ALL');
  const [historyLinks, setHistoryLinks] = useState(() => {
    try {
      const storageKey = `web_convert_history_${user?.id || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Tải lại lịch sử khi đổi user
  useEffect(() => {
    try {
      const storageKey = `web_convert_history_${user?.id || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setHistoryLinks(JSON.parse(saved));
      } else {
        setHistoryLinks([]);
      }
    } catch (e) {}
  }, [user?.id]);

  // Lưu lịch sử vào localStorage
  const saveHistory = (newLinks) => {
    try {
      const storageKey = `web_convert_history_${user?.id || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(newLinks));
      setHistoryLinks(newLinks);
    } catch (e) {}
  };

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

      const newConverted = (resData.data || []).map((item, idx) => ({
        ...item,
        id: Date.now() + '_' + idx,
        createdAt: new Date().toISOString()
      }));

      setResults(newConverted);
      showToast(`Chuyển đổi thành công ${newConverted.length} liên kết! 🎉`, 'success');

      // Tự động thêm vào đầu Lịch sử chuyển đổi
      const updatedHistory = [...newConverted, ...historyLinks].slice(0, 100);
      saveHistory(updatedHistory);

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
      showToast('Đã sao chép link tiếp thị vào bộ nhớ tạm! 🎉', 'success');
      setTimeout(() => setCopiedIndex(null), 2500);
    }).catch(() => {
      showToast('Không thể sao chép liên kết!', 'error');
    });
  };

  const handleCopyAll = (list) => {
    if (!list || list.length === 0) return;
    const allLinks = list.map(r => r.affiliateUrl || r.affiliateLink || r.shortUrl || r.url).filter(Boolean).join('\n');
    navigator.clipboard.writeText(allLinks).then(() => {
      showToast(`Đã sao chép toàn bộ ${list.length} liên kết! 🎉`, 'success');
    }).catch(() => {
      showToast('Không thể sao chép!', 'error');
    });
  };

  const handleDeleteHistoryItem = (itemId) => {
    const updated = historyLinks.filter(item => item.id !== itemId);
    saveHistory(updated);
    showToast('Đã xóa link khỏi lịch sử!', 'info');
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chuyển đổi?')) {
      saveHistory([]);
      showToast('Đã dọn sạch lịch sử chuyển đổi!', 'info');
    }
  };

  // Helper lấy thông tin Badge Sàn
  const getPlatformMeta = (plat) => {
    const p = (plat || '').toUpperCase();
    if (p.includes('SHOPEE') && !p.includes('FOOD')) {
      return {
        label: 'Shopee',
        icon: 'fa-solid fa-bag-shopping',
        color: '#ea580c',
        bg: 'rgba(234, 88, 12, 0.12)'
      };
    }
    if (p.includes('TIKTOK')) {
      return {
        label: 'TikTok Shop',
        icon: 'fa-brands fa-tiktok',
        color: '#0f172a',
        bg: 'rgba(15, 23, 42, 0.12)'
      };
    }
    if (p.includes('LAZADA')) {
      return {
        label: 'Lazada',
        icon: 'fa-solid fa-heart',
        color: '#0284c7',
        bg: 'rgba(2, 132, 199, 0.12)'
      };
    }
    if (p.includes('FOOD')) {
      return {
        label: 'ShopeeFood',
        icon: 'fa-solid fa-utensils',
        color: '#dc2626',
        bg: 'rgba(220, 38, 38, 0.12)'
      };
    }
    return {
      label: 'Sàn TMĐT',
      icon: 'fa-solid fa-bolt',
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.12)'
    };
  };

  // Lọc lịch sử
  const filteredHistory = historyLinks.filter(item => {
    if (historyFilterPlatform === 'ALL') return true;
    const p = (item.platform || '').toUpperCase();
    if (historyFilterPlatform === 'SHOPEE') return p.includes('SHOPEE') && !p.includes('FOOD');
    if (historyFilterPlatform === 'TIKTOK') return p.includes('TIKTOK');
    if (historyFilterPlatform === 'LAZADA') return p.includes('LAZADA');
    if (historyFilterPlatform === 'SHOPEE_FOOD') return p.includes('FOOD');
    return true;
  });

  return (
    <div className="convert-view-wrapper" style={{ width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      
      {/* 1. THẺ CHUYỂN ĐỔI LINK CHÍNH (ĐÃ BỎ PHẦN SUBID THEO YÊU CẦU) */}
      <div className="lookup-card" style={{ padding: '24px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              flexShrink: 0
            }}>
              <i className="fa-solid fa-bolt"></i>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '650', margin: 0, color: 'var(--text-bright)' }}>
                Tạo Link Tiếp Thị & Hoàn Tiền Tự Động
              </h2>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Hỗ trợ đồng thời <b>Shopee</b>, <b>TikTok Shop</b>, <b>Lazada</b> và <b>ShopeeFood</b>
              </div>
            </div>
          </div>
        </div>

        {/* CÁC NỀN TẢNG ĐƯỢC HỖ TRỢ CHUYỂN ĐỔI (LÀM THEO 2 HÀNG NGANG 2 CỘT) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(234, 88, 12, 0.12)',
            color: '#ea580c',
            border: '1px solid rgba(234, 88, 12, 0.25)',
            fontSize: '12.5px',
            fontWeight: '700'
          }}>
            <i className="fa-solid fa-bag-shopping"></i>
            <span>Shopee</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'var(--bg-main)',
            color: 'var(--text-bright)',
            border: '1px solid var(--border-color)',
            fontSize: '12.5px',
            fontWeight: '700'
          }}>
            <i className="fa-brands fa-tiktok"></i>
            <span>TikTok Shop</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(2, 132, 199, 0.12)',
            color: '#0284c7',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            fontSize: '12.5px',
            fontWeight: '700'
          }}>
            <i className="fa-solid fa-heart"></i>
            <span>Lazada</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(220, 38, 38, 0.12)',
            color: '#dc2626',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            fontSize: '12.5px',
            fontWeight: '700'
          }}>
            <i className="fa-solid fa-utensils"></i>
            <span>ShopeeFood</span>
          </div>
        </div>

        {/* Input Textarea Form */}
        <form onSubmit={handleConvert}>
          <div className="lookup-input-group" style={{ marginBottom: '14px' }}>
            <label className="lookup-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Dán link sản phẩm (hỗ trợ nhiều link, mỗi dòng 1 link):</span>
              <span style={{ fontSize: '11.5px', textTransform: 'none', color: 'var(--text-muted)', fontWeight: '600' }}>
                Đã nhập: <b>{inputText.split('\n').filter(l => l.trim()).length}</b> link
              </span>
            </label>
            <textarea
              className="lookup-input"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: '85px',
                lineHeight: '1.5',
                fontFamily: 'monospace',
                fontSize: '13px',
                padding: '12px 14px',
                borderRadius: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="lookup-admin-link"
                style={{ fontSize: '12.5px', padding: '10px 16px' }}
              >
                <i className="fa-solid fa-trash-can"></i>
                <span>Xóa nội dung</span>
              </button>
            )}
            <button
              type="submit"
              disabled={converting || !inputText.trim()}
              className="lookup-btn"
              style={{ flex: 1, padding: '13px' }}
            >
              {converting ? (
                <>
                  <div className="lookup-spinner"></div>
                  <span>Đang chuyển đổi link...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-arrows-rotate"></i>
                  <span>Chuyển Đổi Link Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. KẾT QUẢ VỪA CHUYỂN ĐỔI (HIỂN THỊ KÈM ẢNH SẢN PHẨM) */}
      {results.length > 0 && (
        <div className="orders-container" style={{ width: '100%', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-square-check" style={{ color: 'var(--text-muted)', fontSize: '16px' }}></i>
              <h3 className="stats-section-title" style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
                Kết Quả Chuyển Đổi Mới Nhất ({results.length} link)
              </h3>
            </div>
            {results.length > 1 && (
              <button
                type="button"
                onClick={() => handleCopyAll(results)}
                className="lookup-admin-link"
                style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(249, 115, 22, 0.12)', color: 'var(--color-primary, #ea580c)', borderColor: 'rgba(249, 115, 22, 0.3)' }}
              >
                <i className="fa-solid fa-copy" style={{ color: 'var(--text-muted)' }}></i>
                <span>Copy tất cả link</span>
              </button>
            )}
          </div>

          {results.map((r, idx) => {
            const finalLink = r.affiliateUrl || r.affiliateLink || r.shortUrl || r.url || '';
            const isCopied = copiedIndex === idx;
            const meta = getPlatformMeta(r.platform);
            const estComm = r.commission || (r.price && r.commissionRate ? Math.round((Number(r.price) * Number(r.commissionRate)) / 100) : 0);

            return (
              <div key={idx} className="order-card-item" style={{ padding: '16px 18px', marginBottom: '12px' }}>
                <div className="order-card-header" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    background: 'var(--bg-main)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <i className={meta.icon} style={{ color: 'var(--text-muted)' }}></i>
                    <span>{meta.label}</span>
                  </span>
                  {r.commissionRate && (
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-coins" style={{ color: 'var(--text-muted)', fontSize: '11px' }}></i>
                      <span>Hoa hồng: {r.commissionRate}% {estComm > 0 ? `(~${formatMoney(estComm)} ước tính)` : ''}</span>
                    </span>
                  )}
                </div>

                {/* HÀNG HIỂN THỊ ẢNH & TÊN SẢN PHẨM */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl}
                      alt={r.productName || 'Ảnh sản phẩm'}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '52px',
                        height: '52px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        flexShrink: 0
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '10px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      <i className={meta.icon}></i>
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13.5px',
                      fontWeight: '700',
                      color: 'var(--text-bright)',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {r.productName || 'Sản phẩm mua sắm qua link tiếp thị'}
                    </div>
                    {r.price && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Giá: <b style={{ color: 'var(--text-bright)' }}>{formatMoney(r.price)}</b>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nút Hành Động (Không hiển thị link dài) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <a
                    href={finalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lookup-admin-link"
                    style={{ fontSize: '12.5px', padding: '7px 16px', textDecoration: 'none' }}
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: 'var(--text-muted)' }}></i>
                    <span>Mở link mua sắm</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(finalLink, idx)}
                    className="lookup-btn"
                    style={{
                      width: 'auto',
                      padding: '7px 18px',
                      fontSize: '12.5px',
                      borderRadius: '10px',
                      background: isCopied ? '#059669' : undefined
                    }}
                  >
                    <i className={isCopied ? 'fa-solid fa-circle-check' : 'fa-solid fa-copy'}></i>
                    <span>{isCopied ? 'Đã sao chép!' : 'Sao chép link'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. LỊCH SỬ CHUYỂN ĐỔI WEB (ĐẦY ĐỦ ẢNH SẢN PHẨM & BỘ LỌC TƯƠNG TỰ MAI LAN) */}
      <div className="orders-container" style={{ width: '100%', marginBottom: '24px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          padding: '18px 20px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Header Lịch Sử */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: isHistoryOpen ? '14px' : '0'
          }}>
            <div 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--bg-main)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div>
                <h3 style={{ fontSize: '15.5px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
                  Lịch Sử Chuyển Đổi Web ({historyLinks.length})
                </h3>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Lưu trữ tự động các link bạn đã chuyển đổi để dùng lại
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {historyLinks.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="lookup-admin-link"
                  style={{ fontSize: '11.5px', padding: '5px 10px', color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.25)' }}
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Xóa lịch sử</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="lookup-admin-link"
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                <span>{isHistoryOpen ? 'Thu gọn' : 'Mở ra'}</span>
                <i className={`fa-solid fa-chevron-${isHistoryOpen ? 'up' : 'down'}`} style={{ marginLeft: '4px' }}></i>
              </button>
            </div>
          </div>

          {/* Nội dung Lịch Sử (Khi mở) */}
          {isHistoryOpen && (
            <div>
              {/* Bộ lọc lịch sử dạng ấn vào chọn (Gọn gàng, không cần vuốt kéo) */}
              <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', maxWidth: '280px' }}>
                  <i
                    className="fa-solid fa-filter"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      pointerEvents: 'none'
                    }}
                  ></i>
                  <select
                    value={historyFilterPlatform}
                    onChange={e => setHistoryFilterPlatform(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 28px 8px 32px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-bright)',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none'
                    }}
                  >
                    <option value="ALL">Tất cả sàn ({historyLinks.length} link)</option>
                    <option value="SHOPEE">Shopee ({historyLinks.filter(i => getPlatformMeta(i.platform).name === 'Shopee').length} link)</option>
                    <option value="TIKTOK">TikTok Shop ({historyLinks.filter(i => getPlatformMeta(i.platform).name === 'TikTok Shop').length} link)</option>
                    <option value="LAZADA">Lazada ({historyLinks.filter(i => getPlatformMeta(i.platform).name === 'Lazada').length} link)</option>
                    <option value="SHOPEE_FOOD">ShopeeFood ({historyLinks.filter(i => getPlatformMeta(i.platform).name === 'ShopeeFood').length} link)</option>
                  </select>
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      pointerEvents: 'none'
                    }}
                  ></i>
                </div>
              </div>

              {/* Danh sách các link trong lịch sử */}
              {filteredHistory.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '24px', color: 'var(--text-subtle)', marginBottom: '8px' }}></i>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright)' }}>Chưa có lịch sử chuyển đổi</div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>Dán link sản phẩm và nhấn Chuyển Đổi để bắt đầu tích lũy</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredHistory.map((item) => {
                    const finalLink = item.affiliateUrl || item.affiliateLink || item.shortUrl || item.url || '';
                    const meta = getPlatformMeta(item.platform);
                    const itemEstComm = item.commission || (item.price && item.commissionRate ? Math.round((Number(item.price) * Number(item.commissionRate)) / 100) : 0);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '14px',
                          padding: '12px 14px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Header Item */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '10.5px',
                            fontWeight: '700',
                            background: 'var(--bg-card)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className={meta.icon} style={{ color: 'var(--text-muted)' }}></i>
                            <span>{meta.label}</span>
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryItem(item.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: '11px', padding: '2px' }}
                              title="Xóa link này"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        </div>

                        {/* Thân Item: Ảnh + Tên sản phẩm + Giá & Hoa hồng ước tính (Không hiện link dài) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName || 'Ảnh sản phẩm'}
                              referrerPolicy="no-referrer"
                              style={{
                                width: '44px',
                                height: '44px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                flexShrink: 0
                              }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '8px',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                              fontSize: '16px',
                              flexShrink: 0
                            }}>
                              <i className={meta.icon}></i>
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: 'var(--text-bright)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.productName || 'Sản phẩm mua sắm qua link tiếp thị'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                              {item.price && (
                                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                  Giá: <b style={{ color: 'var(--text-bright)' }}>{formatMoney(item.price)}</b>
                                </span>
                              )}
                              {item.commissionRate && (
                                <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fa-solid fa-coins" style={{ color: 'var(--text-muted)', fontSize: '10px' }}></i>
                                  <span>Hoa hồng: {item.commissionRate}% {itemEstComm > 0 ? `(~${formatMoney(itemEstComm)} ước tính)` : ''}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions (Không hiển thị link dài) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <a
                            href={finalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="lookup-admin-link"
                            style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ color: 'var(--text-muted)' }}></i>
                            <span>Mua ngay</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(finalLink);
                              showToast('Đã sao chép link tiếp thị! 🎉', 'success');
                            }}
                            className="lookup-admin-link"
                            style={{
                              fontSize: '11px',
                              padding: '4px 10px',
                              background: 'rgba(249, 115, 22, 0.12)',
                              color: 'var(--color-primary, #ea580c)',
                              borderColor: 'rgba(249, 115, 22, 0.3)',
                              fontWeight: '700'
                            }}
                          >
                            <i className="fa-solid fa-copy"></i>
                            <span>Copy link</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. MẸO VÀNG & LƯU Ý MUA SẮM ĐỂ KHÔNG BỊ RỚT ĐƠN 100% (CÓ NÚT THU GỌN) */}
      <div className="lookup-card" style={{
        marginBottom: '24px',
        border: '1.5px solid rgba(249, 115, 22, 0.35)',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, var(--bg-card) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: isTipsOpen ? '14px' : '0'
        }}>
          <div 
            onClick={() => setIsTipsOpen(!isTipsOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--bg-main)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0
            }}>
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: '800', margin: 0, color: 'var(--text-bright)' }}>
                Mẹo Nhỏ Mua Sắm Để Không Bị Rớt Đơn 100%
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Áp dụng đúng 4 bước dưới đây để được hệ thống sàn ghi nhận hoa hồng chuẩn xác tuyệt đối
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTipsOpen(!isTipsOpen)}
            className="lookup-admin-link"
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            <span>{isTipsOpen ? 'Thu gọn' : 'Mở ra'}</span>
            <i className={`fa-solid fa-chevron-${isTipsOpen ? 'up' : 'down'}`} style={{ marginLeft: '4px' }}></i>
          </button>
        </div>

        {isTipsOpen && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
            marginTop: '10px'
          }}>
            {/* Bước 1: Dọn giỏ hàng */}
            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '800',
                flexShrink: 0
              }}>
                1
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '3px' }}>
                  Xóa sản phẩm cũ trong giỏ hàng
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  Nếu sản phẩm đã từng cho vào giỏ từ trước, hãy <b>xóa khỏi giỏ</b> rồi mới bấm link tiếp thị để kích hoạt lại cookie hoa hồng của bạn.
                </div>
              </div>
            </div>

            {/* Bước 2: Bấm link vào App */}
            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.14)',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '800',
                flexShrink: 0
              }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '3px' }}>
                  Bấm link mở thẳng ứng dụng (App)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  Bấm vào link tiếp thị vừa tạo để mở App Shopee, TikTok Shop hoặc Lazada. <i>(Mẹo: Nên bấm vào link 2 lần để đảm bảo ứng dụng bắt link chuẩn)</i>.
                </div>
              </div>
            </div>

            {/* Bước 3: Mua ngay không xem live */}
            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '800',
                flexShrink: 0
              }}>
                3
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '3px' }}>
                  Đặt mua ngay — Không xem Live/Video
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  Sau khi vào App, tiến hành đặt hàng ngay. <b>Tuyệt đối không thoát ra xem Livestream hoặc Video khác giữa chừng</b> vì sẽ bị mất mã ghi nhận đơn.
                </div>
              </div>
            </div>

            {/* Bước 4: Thời gian đồng bộ đơn */}
            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.12)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '800',
                flexShrink: 0
              }}>
                4
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-bright)', marginBottom: '3px' }}>
                  Thời gian đồng bộ đơn hàng
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  Đơn hàng thường hiển thị trong mục <b>Đơn Hàng Đã Đặt</b> sau 15-30 phút (Shopee/TikTok) hoặc chậm nhất vào 9H sáng hôm sau khi các sàn cập nhật đối soát.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. CARD HƯỚNG DẪN HOÀN TIỀN & HOA HỒNG */}
      <div className="lookup-card" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, var(--bg-card) 100%)',
        border: '1.5px solid rgba(59, 130, 246, 0.25)',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#2563eb', fontWeight: '800', fontSize: '14px' }}>
          <i className="fa-solid fa-shield-halved"></i>
          <span>Cơ Chế Ghi Nhận Hoa Hồng & Hoàn Tiền Minh Bạch</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
          <li>Hệ thống tự động gắn mã SubID của bạn vào từng link sản phẩm để sàn ghi nhận hoa hồng chuẩn xác 100%.</li>
          <li>Hoa hồng chia sẻ lại cho thành viên lên tới <b>80%</b> giá trị hoa hồng nhận được từ Shopee, TikTok Shop, Lazada.</li>
          <li>Sau khi đơn hàng giao thành công, hoa hồng sẽ tự động cập nhật vào mục <b>Đơn hàng đã đặt</b> và tích lũy vào <b>Ví tiền</b> của bạn.</li>
        </ul>
      </div>

    </div>
  );
}
