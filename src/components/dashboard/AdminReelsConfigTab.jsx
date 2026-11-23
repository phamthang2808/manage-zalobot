import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";

export default function AdminReelsConfigTab() {
  const { token, theme } = useApp();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [videoIds, setVideoIds] = useState("");
  const [minPrice, setMinPrice] = useState(100000);
  const [maxPrice, setMaxPrice] = useState(1600000);
  const [excludeFashion, setExcludeFashion] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const notify = (msg, type = "info") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reels-config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEnabled(!!data.enabled);
        setPageAccessToken(data.pageAccessToken || "");
        setVideoIds(data.videoIds || "");
        setMinPrice(data.minPrice != null ? data.minPrice : 100000);
        setMaxPrice(data.maxPrice != null ? data.maxPrice : 1600000);
        setExcludeFashion(data.excludeFashion !== undefined ? !!data.excludeFashion : true);
      } else {
        notify("Không thể tải cấu hình Reels từ máy chủ", "error");
      }
    } catch (err) {
      notify("Lỗi kết nối tải cấu hình: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleToggleEnabled = async (newVal) => {
    setEnabled(newVal);
    try {
      const res = await fetch("/api/admin/reels-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: newVal,
          pageAccessToken,
          videoIds,
          minPrice: Number(minPrice) || 100000,
          maxPrice: Number(maxPrice) || 1600000,
          excludeFashion,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify(newVal ? "Đã BẬT tính năng Mua qua Reels! ✨" : "Đã TẮT tính năng Mua qua Reels! ⛔", "success");
      } else {
        notify(data.message || "Lỗi cập nhật trạng thái", "error");
      }
    } catch (err) {
      notify("Lỗi lưu trạng thái: " + err.message, "error");
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/admin/reels-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled,
          pageAccessToken,
          videoIds,
          minPrice: Number(minPrice) || 100000,
          maxPrice: Number(maxPrice) || 1600000,
          excludeFashion,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify(data.message || "Đã lưu cấu hình Reels thành công! 🎉", "success");
      } else {
        notify(data.message || "Lỗi lưu cấu hình", "error");
      }
    } catch (err) {
      notify("Lỗi kết nối khi lưu: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestToken = async () => {
    if (!pageAccessToken.trim()) {
      notify("Vui lòng nhập Page Access Token trước khi kiểm tra!", "warning");
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const sampleId = videoIds.trim().split(/[,\n\r;]+/)[0]?.trim() || "";
      const res = await fetch("/api/admin/reels-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageAccessToken: pageAccessToken.trim(),
          reelId: sampleId,
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        notify("Kiểm tra Token thành công: Trang " + data.pageName, "success");
      } else {
        notify(data.message || "Token không hợp lệ hoặc đã hết hạn", "error");
      }
    } catch (err) {
      notify("Lỗi khi kiểm tra Token: " + err.message, "error");
    } finally {
      setTesting(false);
    }
  };

  const validVideoCount = videoIds
    .split(/[,\n\r;]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0).length;

  // Dark mode color palette
  const c = {
    cardBg: isDark ? "#1e293b" : "#ffffff",
    cardBorder: isDark ? "#334155" : "#e2e8f0",
    subCardBg: isDark ? "#0f172a" : "#f8fafc",
    subCardBorder: isDark ? "#334155" : "#e2e8f0",
    title: isDark ? "#f8fafc" : "#1e293b",
    text: isDark ? "#cbd5e1" : "#334155",
    muted: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#0f172a" : "#ffffff",
    inputBorder: isDark ? "#334155" : "#cbd5e1",
    inputColor: isDark ? "#f8fafc" : "#1e293b",
    tipBlueBg: isDark ? "rgba(30, 58, 138, 0.25)" : "#eff6ff",
    tipBlueBorder: isDark ? "#1e40af" : "#bfdbfe",
    tipBlueText: isDark ? "#93c5fd" : "#1d4ed8",
    tipAmberBg: isDark ? "rgba(120, 53, 15, 0.25)" : "#fffbeb",
    tipAmberBorder: isDark ? "#854d0e" : "#fef3c7",
    tipAmberText: isDark ? "#fcd34d" : "#b45309",
    btnSecondaryBg: isDark ? "#1e293b" : "#ffffff",
    btnSecondaryBorder: isDark ? "#334155" : "#cbd5e1",
    btnSecondaryText: isDark ? "#cbd5e1" : "#334155",
  };

  return (
    <div className="space-y-6 reels-config-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 0' }}>
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'success' ? '#10b981' : '#3b82f6',
          color: '#fff', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)'
        }}>
          {toastMessage.msg}
        </div>
      )}

      {/* Header Giới thiệu tab */}
      <div className="reels-config-card" style={{
        background: c.cardBg, borderRadius: '24px', padding: '24px',
        border: `1px solid ${c.cardBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 12px', borderRadius: '999px', background: c.tipBlueBg,
            border: `1px solid ${c.tipBlueBorder}`, color: c.tipBlueText, fontSize: '12px', fontWeight: 'bold', marginBottom: '8px'
          }}>
            <i className="fa-brands fa-facebook"></i> Facebook Reels Affiliate Bot
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: c.title, margin: '4px 0' }}>
            Cấu Hình Tự Động Bình Luận "Mua Qua Reels"
          </h2>
          <p style={{ fontSize: '13px', color: c.muted, marginTop: '4px', maxWidth: '650px', lineHeight: '1.6' }}>
            Tự động gửi bình luận chứa link Shopee vào các bài Facebook Reels của Fanpage theo thuật toán xoay vòng video (Round-Robin) và giới hạn khoảng giá đơn hàng nhằm <b>chống quét spam tuyệt đối</b>.
          </p>
        </div>

        <button
          type="button"
          onClick={loadConfig}
          disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: '14px', border: `1px solid ${c.btnSecondaryBorder}`,
            background: c.btnSecondaryBg, color: c.btnSecondaryText, fontSize: '12px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <i className={`fa-solid fa-rotate ${loading ? "fa-spin text-blue-500" : ""}`}></i>
          <span>Làm mới cấu hình</span>
        </button>
      </div>

      {loading ? (
        <div className="reels-config-card" style={{ background: c.cardBg, borderRadius: '24px', padding: '48px', textAlign: 'center', border: `1px solid ${c.cardBorder}` }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#3b82f6', marginBottom: '12px' }}></i>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: c.muted }}>Đang tải cấu hình Facebook Reels...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. KHỐI BẬT / TẮT TÍNH NĂNG */}
          <div className="reels-config-card" style={{
            background: c.cardBg, borderRadius: '24px', padding: '24px',
            border: `1px solid ${c.cardBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: c.title, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-power-off" style={{ color: '#3b82f6' }}></i>
                <span>Trạng Thái Tính Năng Mua Qua Reels</span>
              </h3>
              <p style={{ fontSize: '12px', color: c.muted, fontWeight: '500', marginTop: '4px' }}>
                Bật công tắc này để hệ thống hiển thị nút "Mua qua Reels" và kích hoạt bot bình luận
              </p>
            </div>

            <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              <div style={{
                width: '56px', height: '28px', borderRadius: '999px',
                background: enabled ? '#10b981' : (isDark ? '#334155' : '#cbd5e1'), transition: 'all 0.3s ease',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', top: '2px', left: enabled ? '30px' : '4px',
                  width: '24px', height: '24px', borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'all 0.3s ease'
                }}></div>
              </div>
              <span style={{ marginLeft: '12px', fontSize: '13px', fontWeight: '900', color: enabled ? '#10b981' : c.muted }}>
                {enabled ? "ĐANG BẬT" : "TẠM TẮT"}
              </span>
            </label>
          </div>

          {/* 2. KHỐI FACEBOOK PAGE ACCESS TOKEN */}
          <div className="reels-config-card" style={{
            background: c.cardBg, borderRadius: '24px', padding: '24px',
            border: `1px solid ${c.cardBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '900', color: c.title, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-key" style={{ color: '#3b82f6' }}></i>
                  <span>Facebook Page Access Token (Graph API)</span>
                </h3>
                <p style={{ fontSize: '12px', color: c.muted, fontWeight: '500', marginTop: '4px' }}>
                  Token của Fanpage sở hữu các video Reels (cần đủ quyền <code style={{ background: isDark ? '#334155' : '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: c.title }}>pages_manage_posts</code> và <code style={{ background: isDark ? '#334155' : '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: c.title }}>pages_manage_engagement</code>)
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestToken}
                disabled={testing || !pageAccessToken.trim()}
                style={{
                  padding: '8px 16px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                  color: '#fff', fontSize: '12px', fontWeight: 'bold', border: 'none',
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  opacity: (testing || !pageAccessToken.trim()) ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                }}
              >
                {testing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Kiểm tra Token</span>
                  </>
                )}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showToken ? "text" : "password"}
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                placeholder="Dán Facebook Page Access Token vào đây (bắt đầu bằng EAA...)"
                className="reels-config-input"
                style={{
                  width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`,
                  borderRadius: '16px', padding: '12px 90px 12px 16px', fontSize: '12px',
                  fontFamily: 'monospace', fontWeight: 'bold', color: c.inputColor, outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', fontSize: '12px', fontWeight: 'bold',
                  color: c.muted, cursor: 'pointer'
                }}
              >
                <i className={`fa-solid ${showToken ? "fa-eye-slash" : "fa-eye"} mr-1`}></i>
                {showToken ? "Ẩn" : "Hiện"}
              </button>
            </div>

            {testResult && (
              <div style={{
                padding: '16px', borderRadius: '16px', fontSize: '12px', lineHeight: '1.6',
                background: testResult.success ? (isDark ? 'rgba(6, 78, 59, 0.4)' : '#ecfdf5') : (isDark ? 'rgba(159, 18, 57, 0.4)' : '#fff1f2'),
                border: `1px solid ${testResult.success ? (isDark ? '#059669' : '#a7f3d0') : (isDark ? '#e11d48' : '#fecdd3')}`,
                color: testResult.success ? (isDark ? '#6ee7b7' : '#065f46') : (isDark ? '#fda4af' : '#9f1239')
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <i style={{ fontSize: '16px', marginTop: '2px' }} className={`fa-solid ${testResult.success ? "fa-circle-check text-emerald-500" : "fa-circle-xmark text-rose-500"}`}></i>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{testResult.message}</p>
                    {testResult.success && (
                      <div style={{ fontSize: '11px', marginTop: '6px', fontFamily: 'monospace' }}>
                        <span><b>Page ID:</b> {testResult.pageId} | <b>Page Name:</b> {testResult.pageName}</span>
                      </div>
                    )}
                    {testResult.reelValid !== undefined && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${isDark ? '#334155' : 'rgba(0,0,0,0.06)'}`, fontSize: '11px' }}>
                        {testResult.reelValid ? (
                          <span>✅ Video Reels ID: <b>{testResult.reelId}</b> hợp lệ & truy cập thành công!</span>
                        ) : (
                          <span>⚠️ {testResult.reelError}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{
              background: c.tipBlueBg, border: `1px solid ${c.tipBlueBorder}`,
              borderRadius: '16px', padding: '14px 18px', fontSize: '11.5px', color: c.tipBlueText, lineHeight: '1.6'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <i className="fa-solid fa-circle-info" style={{ marginTop: '3px', fontSize: '13px' }}></i>
                <div>
                  <b>Cấu hình Token động qua API:</b> Token và các video Reels được lưu và xử lý trực tiếp qua API hệ thống khi bạn bấm <b>Lưu Cấu Hình</b>, hoàn toàn không bị gán cứng cố định trong mã nguồn.
                  <div style={{ marginTop: '4px', opacity: 0.9 }}>
                    <b>Lưu ý về Token:</b> Nếu lấy token tạm thời từ Graph API Explorer (thời hạn 1-2 giờ), Facebook sẽ báo hết hạn (mã lỗi 190). Bạn nên tạo <b>Page Access Token vĩnh viễn (Never Expire)</b> cho Fanpage để bot tự động bình luận lâu dài không bị ngắt quãng.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. KHỐI DANH SÁCH VIDEO REELS LUÂN CHUYỂN */}
          <div className="reels-config-card" style={{
            background: c.cardBg, borderRadius: '24px', padding: '24px',
            border: `1px solid ${c.cardBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '900', color: c.title, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-film" style={{ color: '#3b82f6' }}></i>
                  <span>Danh Sách Video Reels Luân Chuyển (Round-Robin)</span>
                </h3>
                <p style={{ fontSize: '12px', color: c.muted, fontWeight: '500', marginTop: '4px' }}>
                  Nhập mỗi dòng 1 link Facebook Reel hoặc 1 mã Reel ID. Bot sẽ tự động xoay vòng lần lượt để tránh dồn cmt vào 1 video.
                </p>
              </div>

              <span style={{
                fontSize: '12px', fontWeight: '900', padding: '4px 12px',
                background: c.tipAmberBg, color: c.tipAmberText, border: `1px solid ${c.tipAmberBorder}`,
                borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}>
                <i className="fa-solid fa-list-ol"></i>
                <span>Đang có: {validVideoCount} video</span>
              </span>
            </div>

            <textarea
              rows={5}
              value={videoIds}
              onChange={(e) => setVideoIds(e.target.value)}
              placeholder={`Ví dụ:\n1509788077681223\nhttps://www.facebook.com/reel/9876543210123456/\nhttps://www.facebook.com/reel/1122334455667788/`}
              className="reels-config-input"
              style={{
                width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`,
                borderRadius: '16px', padding: '14px', fontSize: '12px',
                fontFamily: 'monospace', fontWeight: 'bold', color: c.inputColor,
                lineHeight: '1.7', resize: 'vertical', outline: 'none'
              }}
            />

            <div style={{
              background: c.tipAmberBg, border: `1px solid ${c.tipAmberBorder}`,
              borderRadius: '16px', padding: '12px 16px', fontSize: '11px', color: c.tipAmberText, lineHeight: '1.5'
            }}>
              <i className="fa-solid fa-lightbulb mr-2"></i>
              <b>Mẹo tránh bị Facebook chặn Spam:</b> Nên nhập từ <b>3 đến 5 video Reels khác nhau</b>. Hệ thống sẽ tự động gắn lần lượt video 1, video 2, video 3... cho mỗi khách hàng khác nhau. Bạn có thể thêm/bớt video bất cứ lúc nào!
            </div>
          </div>

          {/* 4. KHỐI ĐIỀU KIỆN KHOẢNG GIÁ & BỎ QUA THỜI TRANG */}
          <div className="reels-config-card" style={{
            background: c.cardBg, borderRadius: '24px', padding: '24px',
            border: `1px solid ${c.cardBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: c.title, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-sliders" style={{ color: '#3b82f6' }}></i>
                <span>Điều Kiện Tự Động Gắn Link Reels</span>
              </h3>
              <p style={{ fontSize: '12px', color: c.muted, fontWeight: '500', marginTop: '4px' }}>
                Thiết lập khoảng giá sản phẩm và danh mục phù hợp để bảo vệ video Fanpage
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Min Price */}
              <div className="reels-config-subcard" style={{ background: c.subCardBg, padding: '16px', borderRadius: '16px', border: `1px solid ${c.subCardBorder}` }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: c.text, display: 'block', marginBottom: '8px' }}>
                  Giá sản phẩm tối thiểu (Min Price)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="reels-config-input"
                    style={{
                      width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`,
                      borderRadius: '12px', padding: '8px 12px', fontSize: '14px',
                      fontWeight: '900', color: c.inputColor, outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: c.muted }}>VNĐ</span>
                </div>
                <p style={{ fontSize: '10px', color: c.muted, margin: '6px 0 0' }}>
                  Sản phẩm dưới mức này sẽ bỏ qua không gắn Reels.
                </p>
              </div>

              {/* Max Price */}
              <div className="reels-config-subcard" style={{ background: c.subCardBg, padding: '16px', borderRadius: '16px', border: `1px solid ${c.subCardBorder}` }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: c.text, display: 'block', marginBottom: '8px' }}>
                  Giá sản phẩm tối đa (Max Price)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="reels-config-input"
                    style={{
                      width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`,
                      borderRadius: '12px', padding: '8px 12px', fontSize: '14px',
                      fontWeight: '900', color: c.inputColor, outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: c.muted }}>VNĐ</span>
                </div>
                <p style={{ fontSize: '10px', color: c.muted, margin: '6px 0 0' }}>
                  Sản phẩm trên mức này sẽ bỏ qua không gắn Reels.
                </p>
              </div>
            </div>

            {/* Checkbox Bỏ qua Thời trang hoa hồng sàn == 7% */}
            <div className="reels-config-subcard" style={{
              background: c.subCardBg, padding: '16px', borderRadius: '16px',
              border: `1px solid ${c.subCardBorder}`, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
            }}>
              <div style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-shirt" style={{ color: '#3b82f6' }}></i>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: c.title, textTransform: 'uppercase' }}>
                    Tự động bỏ qua ngành Thời trang (Hoa hồng Shopee đúng 7%)
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: c.muted, marginTop: '4px', lineHeight: '1.5' }}>
                  Chỉ nhận diện là Thời trang khi hoa hồng sàn Shopee <b>ĐÚNG 7%</b> (không hơn, không kém). Các sản phẩm khác hoa hồng trên 7% vẫn được gắn Reels bình thường.
                </p>
              </div>

              <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={excludeFashion}
                  onChange={(e) => setExcludeFashion(e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <div style={{
                  width: '52px', height: '26px', borderRadius: '999px',
                  background: excludeFashion ? '#10b981' : (isDark ? '#334155' : '#cbd5e1'), transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute', top: '2px', left: excludeFashion ? '28px' : '3px',
                    width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'all 0.3s ease'
                  }}></div>
                </div>
                <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: '900', color: excludeFashion ? '#10b981' : c.muted }}>
                  {excludeFashion ? "ĐANG BẬT BỎ QUA" : "TẮT BỎ QUA"}
                </span>
              </label>
            </div>
          </div>

          {/* 5. NÚT LƯU CẤU HÌNH */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 28px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff', borderRadius: '16px', fontSize: '13px', fontWeight: '900',
                border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Đang lưu cấu hình...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>Lưu Cấu Hình Facebook Reels</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
