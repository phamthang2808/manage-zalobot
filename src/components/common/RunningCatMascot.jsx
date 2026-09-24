import React, { useState, useEffect, useRef } from 'react';

const REWARD_AMOUNTS = [
  { amount: '+50.000đ', icon: '💸', isBig: false },
  { amount: '+100.000đ', icon: '💸', isBig: false },
  { amount: '+200.000đ', icon: '🚀', isBig: true },
  { amount: '+500.000đ', icon: '🔥', isBig: true },
  { amount: '+30.000đ', icon: '💰', isBig: false },
  { amount: '+150.000đ', icon: '💎', isBig: true },
  { amount: '+300.000đ', icon: '👑', isBig: true }
];

const ITEM_ICONS = ['💰', '💵', '🎁', '💎', '👑', '🏆'];

// Các vùng độ cao ngẫu nhiên (Vùng trên, Giữa màn hình, Vùng dưới)
const VERTICAL_ZONES = [
  { min: 10, max: 24 }, // Vùng trên
  { min: 32, max: 54 }, // Vùng giữa màn hình
  { min: 62, max: 76 }  // Vùng dưới màn hình
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function RunningCatMascot() {
  const [catState, setCatState] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const runSequence = async () => {
      if (!isMountedRef.current) return;

      // 1. Tỉ lệ 50-50 xuất phát Trái -> Phải hoặc Phải -> Trái
      const startLeft = Math.random() > 0.5;
      
      // Chọn vùng độ cao màn hình ngẫu nhiên (10vh - 76vh)
      const zone = VERTICAL_ZONES[Math.floor(Math.random() * VERTICAL_ZONES.length)];
      const trackTop = Math.floor(Math.random() * (zone.max - zone.min + 1)) + zone.min;

      const spotCount = Math.floor(Math.random() * 2) + 2; // 2 đến 3 điểm nhặt tiền
      const spots = [];
      const step = 65 / spotCount;

      for (let i = 0; i < spotCount; i++) {
        const x = startLeft
          ? Math.floor(20 + i * step + Math.random() * 10)
          : Math.floor(80 - i * step - Math.random() * 10);
        const y = Math.floor(Math.random() * 40) - 10;
        const reward = REWARD_AMOUNTS[Math.floor(Math.random() * REWARD_AMOUNTS.length)];
        const icon = ITEM_ICONS[Math.floor(Math.random() * ITEM_ICONS.length)];

        spots.push({ id: i, x, y, reward, icon, collected: false });
      }

      // Đặt vị trí xuất phát ban đầu ngoài màn hình
      const initialX = startLeft ? '-90px' : 'calc(100vw + 40px)';

      if (!isMountedRef.current) return;
      setCatState({
        active: true,
        trackTop,
        catX: initialX,
        facingBackwards: false,
        isJumping: false,
        isDashing: false,
        spots,
        startLeft
      });

      await sleep(150);

      // 2. Chạy tới từng vị trí -> Dừng nhặt tiền -> Chạy tiếp (Tốc độ mượt vừa phải)
      for (let i = 0; i < spots.length; i++) {
        if (!isMountedRef.current) return;
        const spot = spots[i];

        // Di chuyển mượt tới điểm nhặt tiền (~0.85s)
        setCatState((prev) => prev ? {
          ...prev,
          catX: `calc(${spot.x}vw - 24px)`,
          isDashing: true,
          isJumping: false
        } : null);

        await sleep(850); // Thời gian di chuyển tới điểm nhặt tiền

        if (!isMountedRef.current) return;
        // Dừng lại 0.6s để thực hiện hiệu ứng nhảy nhặt tiền & cộng tiền nổi lên
        setCatState((prev) => prev ? {
          ...prev,
          isDashing: false,
          isJumping: true,
          spots: prev.spots.map((s) => s.id === spot.id ? { ...s, collected: true } : s)
        } : null);

        await sleep(600); // Thời gian dừng nhặt tiền
      }

      if (!isMountedRef.current) return;

      // 3. Sau khi nhặt xong điểm cuối cùng: Tạm dừng 0.3s -> Lật ngược chú mèo -> Chạy mượt về chỗ cũ (~1.6s)
      await sleep(300);

      if (!isMountedRef.current) return;
      setCatState((prev) => prev ? {
        ...prev,
        facingBackwards: true,
        isJumping: false,
        isDashing: false
      } : null);

      await sleep(200);

      if (!isMountedRef.current) return;
      // Quay về vị trí xuất phát ban đầu ngoài màn hình
      setCatState((prev) => prev ? {
        ...prev,
        catX: initialX
      } : null);

      await sleep(1600); // Thời gian chạy về vị trí cũ

      if (!isMountedRef.current) return;
      setCatState(null);

      // Hẹn giờ đợt chạy tiếp theo (2s - 4s)
      const nextDelay = Math.floor(Math.random() * 2000) + 2000;
      setTimeout(runSequence, nextDelay);
    };

    const initialTimer = setTimeout(runSequence, 800);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimer);
    };
  }, []);

  if (!catState || !catState.active) return null;

  const { trackTop, catX, facingBackwards, isJumping, isDashing, spots, startLeft } = catState;

  // Xác định hướng lật hình ảnh con mèo
  // Ban đầu: LTR = nhìn phải, RTL = lật trái (scaleX(-1))
  // Khi chạy về (facingBackwards): Lật ngược lại
  const shouldFlipHorizontally = startLeft ? facingBackwards : !facingBackwards;

  return (
    <div className="running-cat-scene" style={{ top: `${trackTop}vh` }} aria-hidden="true">
      {/* Chú mèo di chuyển với hiệu ứng Dash & Nhảy nhặt tiền */}
      <div
        className={`dash-cat-runner ${isJumping ? 'jumping' : ''} ${isDashing ? 'dashing' : ''}`}
        style={{
          left: catX,
          transition: isDashing ? 'left 0.85s cubic-bezier(0.25, 1, 0.5, 1)' : 'left 1.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >

        <img
          src="/fvc.png?v=20260924_1"
          alt="Running Mascot"
          className="running-cat-img"
          style={{ transform: shouldFlipHorizontally ? 'scaleX(-1)' : 'none' }}
        />
        <span className="cat-motion-sparkle">✨</span>
      </div>

      {/* Các điểm nhặt tiền trên màn hình */}
      {spots.map((spot) => (
        <div
          key={`spot-${spot.id}`}
          className={`dynamic-money-spot ${spot.collected ? 'collected' : ''}`}
          style={{ left: `${spot.x}vw`, top: `${spot.y}px` }}
        >
          {/* Biểu tượng túi tiền/quà */}
          <div className="money-target">
            <span className="money-icon">{spot.icon}</span>
            <span className="money-ring"></span>
          </div>

          {/* Hiệu ứng cộng tiền nổi lên khi chú mèo tới nhặt */}
          {spot.collected && (
            <div className={`money-plus-float ${spot.reward.isBig ? 'big-reward' : ''}`}>
              <span className="plus-text">{spot.reward.amount}</span>
              <span className="plus-icon">{spot.reward.icon}</span>
            </div>
          )}

          {/* Hạt xu nổ lấp lánh khi va chạm */}
          {spot.collected && (
            <>
              <div className="coin-burst burst-left">🪙</div>
              <div className="coin-burst burst-right">✨</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
