import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";

export default function AdminReelsConfigTab() {
  const { token } = useApp();
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

  return (
    <div className="space-y-6" style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 0' }}>
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'success' ? '#10b981' : '#3b82f6',
          color: '#fff', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
        }}>
          {toastMessage.msg}
        </div>
      )}

      {/* Header Giới thiệu tab */}
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '24px',
        border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 12px', borderRadius: '999px', background: '#eff6ff',
            border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px'
          }}>
            <i className="fa-brands fa-facebook"></i> Facebook Reels Affiliate Bot
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: '4px 0' }}>
            Cấu Hình Tự Động Bình Luận "Mua Qua Reels"
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', maxWidth: '650px', lineHeight: '1.6' }}>
            Tự động gửi bình luận chứa link Shopee vào các bài Facebook Reels của Fanpage theo thuật toán xoay vòng video (Round-Robin) và giới hạn khoảng giá đơn hàng nhằm <b>chống quét spam tuyệt đối</b>.
          </p>
        </div>

        <button
          type="button"
          onClick={loadConfig}
          disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: '14px', border: '1px solid #cbd5e1',
            background: '#fff', color: '#334155', fontSize: '12px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          <i className={`fa-solid fa-rotate ${loading ? "fa-spin text-blue-600" : ""}`}></i>
          <span>Làm mới cấu hình</span>
        </button>
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#3b82f6', marginBottom: '12px' }}></i>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>Đang tải cấu hình Facebook Reels...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. KHỐI BẬT / TẮT TÍNH NĂNG */}
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '24px',
            border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-power-off" style={{ color: '#3b82f6' }}></i>
                <span>Trạng Thái Tính Năng Mua Qua Reels</span>
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', marginTop: '4px' }}>
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
                background: enabled ? '#10b981' : '#e2e8f0', transition: 'all 0.3s ease',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', top: '2px', left: enabled ? '30px' : '4px',
                  width: '24px', height: '24px', borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.3s ease'
                }}></div>
              </div>
              <span style={{ marginLeft: '12px', fontSize: '13px', fontWeight: '900', color: enabled ? '#059669' : '#94a3b8' }}>
                {enabled ? "ĐANG BẬT" : "TẠM TẮT"}
              </span>
            </label>
          </div>

          {/* 2. KHỐI FACEBOOK PAGE ACCESS TOKEN */}
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '24px',
            border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-key" style={{ color: '#3b82f6' }}></i>
                  <span>Facebook Page Access Token (Graph API)</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', marginTop: '4px' }}>
                  Token của Fanpage sở hữu các video Reels (cần đủ quyền <code>pages_manage_posts</code> và <code>pages_manage_engagement</code>)
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
                  opacity: (testing || !pageAccessToken.trim()) ? 0.6 : 1
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
                style={{
                  width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1',
                  borderRadius: '16px', padding: '12px 90px 12px 16px', fontSize: '12px',
                  fontFamily: 'monospace', fontWeight: 'bold', color: '#1e293b', outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', fontSize: '12px', fontWeight: 'bold',
                  color: '#64748b', cursor: 'pointer'
                }}
              >
                <i className={`fa-solid ${showToken ? "fa-eye-slash" : "fa-eye"} mr-1`}></i>
                {showToken ? "Ẩn" : "Hiện"}
              </button>
            </div>

            {testResult && (
              <div style={{
                padding: '16px', borderRadius: '16px', fontSize: '12px', lineHeight: '1.6',
                background: testResult.success ? '#ecfdf5' : '#fff1f2',
                border: `1px solid ${testResult.success ? '#a7f3d0' : '#fecdd3'}`,
                color: testResult.success ? '#065f46' : '#9f1239'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <i style={{ fontSize: '16px', marginTop: '2px' }} className={`fa-solid ${testResult.success ? "fa-circle-check text-emerald-600" : "fa-circle-xmark text-rose-600"}`}></i>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>{testResult.message}</p>
                    {testResult.success && (
                      <div style={{ fontSize: '11px', marginTop: '6px', fontFamily: 'monospace' }}>
                        <span><b>Page ID:</b> {testResult.pageId} | <b>Page Name:</b> {testResult.pageName}</span>
                      </div>
                    )}
                    {testResult.reelValid !== undefined && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '11px' }}>
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
          </div>

          {/* 3. KHỐI DANH SÁCH VIDEO REELS LUÂN CHUYỂN */}
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '24px',
            border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-film" style={{ color: '#3b82f6' }}></i>
                  <span>Danh Sách Video Reels Luân Chuyển (Round-Robin)</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', marginTop: '4px' }}>
                  Nhập mỗi dòng 1 link Facebook Reel hoặc 1 mã Reel ID. Bot sẽ tự động xoay vòng lần lượt để tránh dồn cmt vào 1 video.
                </p>
              </div>

              <span style={{
                fontSize: '12px', fontWeight: '900', padding: '4px 12px',
                background: '#fffbeb', color: '#b45309', borderRadius: '999px', border: '1px solid #fde68a'
              }}>
                <i className="fa-solid fa-list-ol mr-1"></i>
                Đang có: {validVideoCount} video
              </span>
            </div>

            <textarea
              rows={4}
              value={videoIds}
              onChange={(e) => setVideoIds(e.target.value)}
              placeholder={"Ví dụ:\n1509788077681223\nhttps://www.facebook.com/reel/9876543210123456/\nhttps://www.facebook.com/reel/1122334455667788/"}
              style={{
                width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1',
                borderRadius: '16px', padding: '16px', fontSize: '12px', fontFamily: 'monospace',
                fontWeight: 'bold', color: '#1e293b', outline: 'none', lineHeight: '1.6', resize: 'vertical'
              }}
            />
          </div>

          {/* 4. KHỐI ĐIỀU KIỆN LỌC SẢN PHẨM */}
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '24px',
            border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-sliders" style={{ color: '#3b82f6' }}></i>
                <span>Điều Kiện Tự Động Gắn Link Reels</span>
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', marginTop: '4px' }}>
                Thiết lập khoảng giá sản phẩm và danh mục phù hợp để bảo vệ video Fanpage
              </p>
            </div>

            {/* Khoảng giá Min - Max */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Giá sản phẩm tối thiểu (Min Price)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={{
                      width: '100%', background: '#fff', border: '1px solid #cbd5e1',
                      borderRadius: '12px', padding: '8px 12px', fontSize: '14px',
                      fontWeight: '900', color: '#1e293b', outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>VNĐ</span>
                </div>
                <p style={{ fontSize: '10px', color: '#94a3b8', margin: '6px 0 0' }}>
                  Sản phẩm dưới mức này sẽ bỏ qua không gắn Reels.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Giá sản phẩm tối đa (Max Price)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={{
                      width: '100%', background: '#fff', border: '1px solid #cbd5e1',
                      borderRadius: '12px', padding: '8px 12px', fontSize: '14px',
                      fontWeight: '900', color: '#1e293b', outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>VNĐ</span>
                </div>
                <p style={{ fontSize: '10px', color: '#94a3b8', margin: '6px 0 0' }}>
                  Sản phẩm trên mức này sẽ bỏ qua không gắn Reels.
                </p>
              </div>
            </div>

            {/* Checkbox Bỏ qua Thời trang hoa hồng sàn > 2.5% */}
            <div style={{
              background: '#f8fafc', padding: '16px', borderRadius: '16px',
              border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
            }}>
              <div style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-shirt" style={{ color: '#3b82f6' }}></i>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' }}>
                    Tự động bỏ qua ngành Thời trang (Hoa hồng Shopee &gt; 2.5%)
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.5' }}>
                  Ngành thời trang vốn đã có % hoa hồng sàn rất cao (7% - 8%), việc bỏ qua gắn Reels với ngành này giúp tiết kiệm bình luận và tránh spam cho Fanpage.
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
                  background: excludeFashion ? '#10b981' : '#e2e8f0', transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute', top: '2px', left: excludeFashion ? '28px' : '3px',
                    width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.3s ease'
                  }}></div>
                </div>
                <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: '900', color: '#334155' }}>
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
                display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.6 : 1
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

