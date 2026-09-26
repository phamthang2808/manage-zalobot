import React, { useEffect, useState } from "react";

export function ProductLandingView({ code, apiRoot = "" }) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("Mã sản phẩm không hợp lệ.");
      setLoading(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        const root = apiRoot || (import.meta.env.PROD ? "" : "http://localhost:8081");
        const res = await fetch(`${root}/api/short-link/info/${code}`);
        if (res.ok) {
          const data = await res.json();
          setInfo(data);
        } else {
          // Fallback to resolve endpoint
          const res2 = await fetch(`${root}/api/short-link/resolve/${code}`);
          if (res2.ok) {
            const data2 = await res2.json();
            setInfo({
              code,
              longUrl: data2.longUrl,
              productName: "Sản phẩm tiếp thị hoàn tiền",
              platform: "SHOPEE",
              rawCommissionMoney: 0,
              netCommissionMoney: 0
            });
          } else {
            setError("Liên kết không tồn tại hoặc đã hết hạn.");
          }
        }
      } catch (e) {
        console.error("Lỗi khi tải thông tin sản phẩm:", e);
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [code, apiRoot]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTarget = () => {
    if (info && info.longUrl) {
      window.location.href = info.longUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7f5] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-orange-600">Đang nạp thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-[#fff7f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 text-center shadow-lg border border-orange-100 max-w-sm w-full space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800">Không tìm thấy sản phẩm</h2>
          <p className="text-xs text-slate-500">{error || "Link tiếp thị không tồn tại"}</p>
          <a
            href="/"
            className="inline-block bg-orange-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  const rawComm = info.rawCommissionMoney || 0;
  const netComm = info.netCommissionMoney || (rawComm > 0 ? rawComm * 0.89 * 0.9 : 0);
  const isTiktok = (info.platform || "").toUpperCase().includes("TIKTOK");
  const platformName = isTiktok ? "TikTok Shop" : "Shopee";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff2ee] via-[#fff8f6] to-[#ffede8] text-slate-800 pb-24 font-sans select-none">
      {/* Top Header Badge */}
      <div className="max-w-md mx-auto pt-4 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-orange-200/60 shadow-xs">
          <span className="text-base">💰</span>
          <div className="flex items-center gap-1.5 text-xs font-black">
            <span className="text-orange-600 font-extrabold">Hoàn Tiền</span>
            <span className="text-slate-700">Shopee - Tiktok</span>
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">90-10</span>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200/50">
          hoantien.store
        </span>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* User Greeting Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 border border-orange-100/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-xl shrink-0">
              🐻
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Xin chào</span>
                <span className="text-sm font-black text-rose-600">
                  {info.senderName || "Thành viên Zalo"}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]">
                {info.subId || "8549966105439390564"}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg"
          >
            Đã đăng nhập
          </button>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-3xl p-4 border border-orange-100 shadow-md space-y-4">
          <div className="flex items-start gap-3">
            {/* Image */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
              {info.imageUrl ? (
                <img
                  src={info.imageUrl}
                  alt={info.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-orange-300">
                  🛍️
                </div>
              )}
              <span className="absolute bottom-0 inset-x-0 bg-rose-600/90 text-white text-[9px] font-black text-center py-0.5 backdrop-blur-xs">
                MIỄN PHÍ VẬN CHUYỂN
              </span>
            </div>

            {/* Title & Stats */}
            <div className="flex-1 space-y-2 min-w-0">
              <h1 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                {info.productName || "Sản phẩm tiếp thị hoàn tiền"}
              </h1>

              {/* Row 1: Hoa Hồng */}
              <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🌷</span>
                  <span className="font-bold text-slate-600 text-[11px]">Hoa hồng</span>
                </div>
                <div className="flex items-center gap-1">
                  {info.commissionRateText && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                      {info.commissionRateText}
                    </span>
                  )}
                  <span className="font-black text-rose-600 text-xs">
                    ~ {rawComm > 0 ? `${rawComm.toLocaleString("vi-VN")}đ` : "---"}
                  </span>
                </div>
              </div>

              {/* Row 2: Hoàn Trả 90% */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">💵</span>
                  <span className="font-bold text-slate-600 text-[11px]">Hoàn trả 90%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                    sau thuế
                  </span>
                  <span className="font-black text-sky-600 text-xs">
                    ~ {netComm > 0 ? `${Math.round(netComm).toLocaleString("vi-VN")}đ` : "---"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Big CTA Button */}
          <button
            type="button"
            onClick={handleOpenTarget}
            className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-orange-600 hover:from-orange-600 hover:to-rose-600 text-white font-black py-4 px-5 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-between transition cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg">
                🛍️
              </div>
              <span className="text-sm tracking-tight">
                Mua trên {platformName} - Nhận hoàn tiền
              </span>
            </div>
            <span className="text-lg">❯</span>
          </button>
        </div>

        {/* Copy Link Share Box */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-orange-100 shadow-xs flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-800 text-xs">Chia sẻ cho bạn bè mua sắm</h4>
            <p className="text-[11px] text-slate-400 font-medium">Bạn sẽ được nhận hoàn hoa hồng</p>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100 font-bold text-xs transition shrink-0 cursor-pointer"
          >
            {copied ? "Đã chép ✓" : "Copy link"}
          </button>
        </div>

        {/* Rules & Tips Card */}
        <div className="bg-amber-50/60 rounded-3xl p-4 border border-amber-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-amber-900 text-xs flex items-center gap-1.5">
              <span className="text-sm">🎀</span> Mua đúng cách để nhận hoa hồng
            </h3>
            <span className="text-amber-500 text-xs">⭐</span>
          </div>

          <div className="space-y-2 text-xs text-amber-900/80 font-medium">
            <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-100">
              <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                Mỗi link này chỉ được ghi nhận 1 đơn. Nếu đã có đơn từ link này, hãy gửi link khác vào bot để tạo link đặt mới.
              </span>
            </div>

            <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-100">
              <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                Xóa sản phẩm khỏi giỏ hàng nếu đã lỡ thêm từ trước, sau đó mới bấm qua link hoàn tiền này để đặt lại.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Nav Bar matching screenshot */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/70 shadow-lg py-2 px-4 flex items-center justify-around z-50">
        <a href="/" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600">
          <span className="text-base">📊</span>
          <span className="text-[10px] font-bold">BXH</span>
        </a>

        <a href="/" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600">
          <span className="text-base">🛒</span>
          <span className="text-[10px] font-bold">Đơn hàng</span>
        </a>

        {/* Center Highlight Button */}
        <a href="/" className="relative -top-4 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-lg shadow-rose-500/30 border-2 border-white">
            🔗
          </div>
          <span className="text-[10px] font-black text-rose-600 mt-0.5">Tạo link</span>
        </a>

        <a href="/" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600">
          <span className="text-base">💳</span>
          <span className="text-[10px] font-bold">Ví tiền</span>
        </a>

        <a href="/" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-600">
          <span className="text-base">🏷️</span>
          <span className="text-[10px] font-bold">Săn sale</span>
        </a>
      </div>
    </div>
  );
}
