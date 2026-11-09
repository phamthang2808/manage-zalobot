import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/formatters';

// Helper parse ngày thành YYYY-MM
const extractYearMonth = (val) => {
  if (!val) return null;
  if (Array.isArray(val) && val.length >= 2) {
    const y = val[0];
    const m = String(val[1]).padStart(2, '0');
    return `${y}-${m}`;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // YYYY-MM-DD hoặc YYYY-MM
    const matchISO = trimmed.match(/^(\d{4})[-/](\d{1,2})/);
    if (matchISO) {
      return `${matchISO[1]}-${matchISO[2].padStart(2, '0')}`;
    }
    // DD/MM/YYYY hoặc DD-MM-YYYY
    const matchDMY = trimmed.match(/^\d{1,2}[-/](\d{1,2})[-/](\d{4})/);
    if (matchDMY) {
      return `${matchDMY[2]}-${matchDMY[1].padStart(2, '0')}`;
    }
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
  } catch (e) {}
  return null;
};

// Định dạng YYYY-MM thành Tháng MM/YYYY
const formatMonthTitle = (ym) => {
  if (!ym) return 'Chưa xác định';
  const parts = ym.split('-');
  if (parts.length === 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return ym;
};

// Định dạng số rút gọn cho trục biểu đồ (ví dụ: 1.2M, 500k)
const formatCompactNumber = (num) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'tr';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
  return String(num);
};

export default function MonthlyRevenueAnalytics() {
  const { orders = [], payouts = [] } = useApp();

  // Bộ lọc
  const [customerRate, setCustomerRate] = useState(80); // Mặc định 80%
  const [platformFilter, setPlatformFilter] = useState('ALL'); // ALL, Shopee, TikTok Shop, ShopeeFood, Lazada
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETED, PENDING
  const [dateBasis, setDateBasis] = useState('purchase'); // 'purchase' | 'complete'
  const [timeRange, setTimeRange] = useState('12m'); // '6m', '12m', 'all'
  const [chartView, setChartView] = useState('cash'); // 'cash' (dòng tiền) | 'orders' (số đơn)
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Toggle hiển thị từng cột trên biểu đồ
  const [visibleSeries, setVisibleSeries] = useState({
    grossComm: true,      // Hoa hồng sàn
    customerCashback: true,// Khách nhận
    adminProfit: true,    // Lợi nhuận Admin
    tax: true             // Thuế TNCN (10%)
  });

  const toggleSeries = (key) => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Phân loại và gom nhóm dữ liệu theo tháng
  const monthlyData = useMemo(() => {
    const map = new Map();

    // Gom dữ liệu từ đơn hàng
    orders.forEach(order => {
      // Lọc theo sàn
      const p = order.platform || 'Shopee';
      if (platformFilter !== 'ALL') {
        if (platformFilter === 'Shopee' && p !== 'Shopee' && p !== 'ShopeeFood') return;
        if (platformFilter === 'ShopeeFood' && p !== 'ShopeeFood') return;
        if (platformFilter === 'TikTok Shop' && p !== 'TikTok Shop') return;
        if (platformFilter === 'Lazada' && p !== 'Lazada') return;
      }

      // Lọc theo trạng thái
      const st = (order.status || '').toLowerCase();
      const isCompleted = st.includes('hoàn thành') || st.includes('completed');
      const isPending = st.includes('chờ') || st.includes('pending') || st.includes('đang xử lý');
      const isCancelled = st.includes('hủy') || st.includes('cancel');

      if (statusFilter === 'COMPLETED' && !isCompleted) return;
      if (statusFilter === 'PENDING' && !isPending) return;

      // Xác định thời gian theo tiêu chí đã chọn
      const rawDate = dateBasis === 'complete' 
        ? (order.completeTime || order.purchaseTime || order.createdAt)
        : (order.purchaseTime || order.completeTime || order.createdAt);

      const ym = extractYearMonth(rawDate) || 'unknown';
      if (ym === 'unknown') return;

      if (!map.has(ym)) {
        map.set(ym, {
          ym,
          label: formatMonthTitle(ym),
          totalOrders: 0,
          shopeeOrders: 0,
          tiktokOrders: 0,
          foodOrders: 0,
          lazadaOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          grossComm: 0,
          actualWithdrawn: 0
        });
      }

      const item = map.get(ym);
      item.totalOrders += 1;

      if (p === 'Shopee') item.shopeeOrders += 1;
      else if (p === 'TikTok Shop') item.tiktokOrders += 1;
      else if (p === 'ShopeeFood') item.foodOrders += 1;
      else if (p === 'Lazada') item.lazadaOrders += 1;

      if (isCompleted) item.completedOrders += 1;
      else if (isPending) item.pendingOrders += 1;
      else if (isCancelled) item.cancelledOrders += 1;

      const comm = Number(order.commission) || 0;
      item.grossComm += comm;
    });

    // Gom dữ liệu rút tiền thực tế (payouts COMPLETED) theo tháng
    payouts.forEach(payout => {
      if (payout.status !== 'COMPLETED') return;
      const ym = extractYearMonth(payout.createdAt);
      if (!ym) return;

      if (map.has(ym)) {
        map.get(ym).actualWithdrawn += (Number(payout.amount) || 0);
      } else {
        // Nếu tháng có rút tiền nhưng chưa có đơn hàng
        map.set(ym, {
          ym,
          label: formatMonthTitle(ym),
          totalOrders: 0,
          shopeeOrders: 0,
          tiktokOrders: 0,
          foodOrders: 0,
          lazadaOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          grossComm: 0,
          actualWithdrawn: Number(payout.amount) || 0
        });
      }
    });

    // Chuyển Map thành mảng và sắp xếp tăng dần theo thời gian (cũ -> mới cho biểu đồ)
    let list = Array.from(map.values()).sort((a, b) => a.ym.localeCompare(b.ym));

    // Lọc theo khung thời gian
    if (timeRange === '6m') {
      list = list.slice(-6);
    } else if (timeRange === '12m') {
      list = list.slice(-12);
    }

    // Tính toán các chỉ số tài chính theo tỷ lệ % khách nhận
    const rateFactor = (customerRate || 0) / 100;
    return list.map(item => {
      const gross = Math.round(item.grossComm);
      const tax = Math.round(gross * 0.10); // Thuế 10%
      const afterTax = gross - tax; // 90%
      const customerCashback = Math.round(afterTax * rateFactor);
      const adminProfit = afterTax - customerCashback;
      const diffWithdrawn = customerCashback - item.actualWithdrawn;

      return {
        ...item,
        grossComm: gross,
        tax,
        afterTax,
        customerCashback,
        adminProfit,
        diffWithdrawn
      };
    });
  }, [orders, payouts, customerRate, platformFilter, statusFilter, dateBasis, timeRange]);

  // 2. Tổng kết toàn kỳ (Summary KPIs)
  const summaryKPIs = useMemo(() => {
    return monthlyData.reduce((acc, curr) => {
      acc.totalOrders += curr.totalOrders;
      acc.shopeeOrders += curr.shopeeOrders;
      acc.tiktokOrders += curr.tiktokOrders;
      acc.grossComm += curr.grossComm;
      acc.tax += curr.tax;
      acc.afterTax += curr.afterTax;
      acc.customerCashback += curr.customerCashback;
      acc.adminProfit += curr.adminProfit;
      acc.actualWithdrawn += curr.actualWithdrawn;
      return acc;
    }, {
      totalOrders: 0,
      shopeeOrders: 0,
      tiktokOrders: 0,
      grossComm: 0,
      tax: 0,
      afterTax: 0,
      customerCashback: 0,
      adminProfit: 0,
      actualWithdrawn: 0
    });
  }, [monthlyData]);

  // 3. Tính toán tọa độ và kích thước cho SVG Chart
  const chartConfig = useMemo(() => {
    const dataLen = monthlyData.length;
    if (dataLen === 0) return null;

    const svgWidth = 980;
    const svgHeight = 320;
    const paddingLeft = 70;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 45;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    // Tìm giá trị max tùy theo viewMode
    let maxVal = 0;
    if (chartView === 'cash') {
      monthlyData.forEach(d => {
        if (visibleSeries.grossComm && d.grossComm > maxVal) maxVal = d.grossComm;
        if (visibleSeries.customerCashback && d.customerCashback > maxVal) maxVal = d.customerCashback;
        if (visibleSeries.adminProfit && d.adminProfit > maxVal) maxVal = d.adminProfit;
        if (visibleSeries.tax && d.tax > maxVal) maxVal = d.tax;
      });
      if (maxVal === 0) maxVal = 1000000;
      // Làm tròn đẹp cho trục Y (lên 10% để không chạm nóc)
      maxVal = Math.ceil((maxVal * 1.15) / 100000) * 100000;
    } else {
      // Số lượng đơn hàng
      monthlyData.forEach(d => {
        if (d.totalOrders > maxVal) maxVal = d.totalOrders;
      });
      if (maxVal === 0) maxVal = 10;
      maxVal = Math.ceil(maxVal * 1.2);
    }

    // Tạo các mốc trục Y (5 mức)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => Math.round(maxVal * ratio));

    // Chiều rộng mỗi nhóm tháng
    const groupWidth = plotWidth / dataLen;
    const barPadding = Math.min(18, groupWidth * 0.18);
    const availableGroupWidth = groupWidth - barPadding * 2;

    return {
      svgWidth,
      svgHeight,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      plotWidth,
      plotHeight,
      maxVal,
      yTicks,
      groupWidth,
      barPadding,
      availableGroupWidth
    };
  }, [monthlyData, chartView, visibleSeries]);

  // Xuất file CSV báo cáo doanh thu theo tháng
  const handleExportCSV = () => {
    if (monthlyData.length === 0) return;
    const headers = [
      'Tháng',
      'Tổng số đơn',
      'Đơn Shopee',
      'Đơn TikTok Shop',
      'Đơn ShopeeFood/Lazada',
      'Hoa hồng sàn (Gross)',
      'Thuế TNCN (10%)',
      'Sau thuế (90%)',
      `Khách nhận (${customerRate}%)`,
      `Admin giữ (${100 - customerRate}%)`,
      'Đã rút thực tế',
      'Chênh lệch (Khách nhận - Đã rút)'
    ];

    const rows = monthlyData.map(d => [
      `"${d.label}"`,
      d.totalOrders,
      d.shopeeOrders,
      d.tiktokOrders,
      d.foodOrders + d.lazadaOrders,
      d.grossComm,
      d.tax,
      d.afterTax,
      d.customerCashback,
      d.adminProfit,
      d.actualWithdrawn,
      d.diffWithdrawn
    ]);

    // Dòng tổng cộng
    rows.push([
      '"TỔNG CỘNG"',
      summaryKPIs.totalOrders,
      summaryKPIs.shopeeOrders,
      summaryKPIs.tiktokOrders,
      '-',
      summaryKPIs.grossComm,
      summaryKPIs.tax,
      summaryKPIs.afterTax,
      summaryKPIs.customerCashback,
      summaryKPIs.adminProfit,
      summaryKPIs.actualWithdrawn,
      summaryKPIs.customerCashback - summaryKPIs.actualWithdrawn
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Theo_Thang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeHoverData = hoveredMonth || (selectedMonth ? monthlyData.find(d => d.ym === selectedMonth) : null);

  return (
    <div className="monthly-analytics-card" style={{
      background: 'var(--bg-card, #ffffff)',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 4px 20px -2px rgba(16, 24, 40, 0.06)'
    }}>
      {/* 1. Header & Bộ chọn tỷ lệ % khách nhận */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-color, #e2e8f0)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(249, 138, 12, 0.15), rgba(234, 108, 2, 0.25))',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>
                Thống Kê Doanh Thu & Đơn Hàng Theo Tháng
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                Biểu đồ trực quan doanh thu hoa hồng sàn, thuế TNCN 10%, tiền hoàn cho khách và lợi nhuận Admin
              </p>
            </div>
          </div>
        </div>

        {/* Nút hành động (Xuất CSV & Đổi view) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-main, #f1f5f9)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #cbd5e1)'
          }}>
            <button
              type="button"
              onClick={() => setChartView('cash')}
              style={{
                border: 'none',
                background: chartView === 'cash' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: chartView === 'cash' ? '#ea580c' : 'var(--text-muted, #64748b)',
                fontWeight: chartView === 'cash' ? '700' : '500',
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: chartView === 'cash' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              💵 Doanh thu & Dòng tiền
            </button>
            <button
              type="button"
              onClick={() => setChartView('orders')}
              style={{
                border: 'none',
                background: chartView === 'orders' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: chartView === 'orders' ? '#0284c7' : 'var(--text-muted, #64748b)',
                fontWeight: chartView === 'orders' ? '700' : '500',
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: chartView === 'orders' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📦 Số lượng đơn hàng
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '9px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#059669',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Tải bảng báo cáo định dạng Excel / CSV"
          >
            <i className="fa-solid fa-file-excel"></i> Xuất Excel / CSV
          </button>
        </div>
      </div>

      {/* 2. KHU VỰC ĐIỀU CHỈNH TỶ LỆ % KHÁCH NHẬN & BỘ LỌC CHI TIẾT */}
      <div style={{
        marginTop: '16px',
        padding: '16px',
        borderRadius: '12px',
        background: 'var(--bg-main, #f8fafc)',
        border: '1px solid var(--border-color, #e2e8f0)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          alignItems: 'center'
        }}>
          {/* A. BỘ LỌC TỶ LỆ % KHÁCH NHẬN */}
          <div style={{ gridColumn: 'span 2', minWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main, #0f172a)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-percent" style={{ color: '#f97316' }}></i>
                Tỷ lệ khách nhận hoàn tiền (Cấu hình % phân bổ):
              </span>
              <span style={{
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#ea580c',
                padding: '2px 10px',
                borderRadius: '6px',
                fontWeight: '800',
                fontSize: '13px',
                border: '1px solid rgba(249, 115, 22, 0.3)'
              }}>
                Khách: {customerRate}% | Admin: {100 - customerRate}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[70, 75, 80, 85, 90, 100].map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setCustomerRate(rate)}
                  style={{
                    border: customerRate === rate ? '1.5px solid #ea580c' : '1px solid var(--border-color, #cbd5e1)',
                    background: customerRate === rate ? '#ea580c' : 'var(--bg-card, #ffffff)',
                    color: customerRate === rate ? '#ffffff' : 'var(--text-main, #334155)',
                    padding: '5px 12px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: customerRate === rate ? '800' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {rate}% {rate === 80 && '(Chuẩn)'}
                </button>
              ))}

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={customerRate}
                  onChange={(e) => setCustomerRate(Number(e.target.value))}
                  style={{ width: '110px', accentColor: '#ea580c', cursor: 'pointer' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customerRate}
                  onChange={(e) => {
                    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                    setCustomerRate(v);
                  }}
                  style={{
                    width: '56px',
                    padding: '4px 6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textAlign: 'center',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    background: 'var(--bg-card, #ffffff)',
                    color: 'var(--text-main, #0f172a)'
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>

            <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted, #64748b)', lineHeight: '1.4' }}>
              💡 <em>Công thức:</em> Hoa hồng sàn ➔ <strong>Trừ 10% Thuế TNCN</strong> ➔ Còn 90% sau thuế.
              Khách hưởng <strong>{customerRate}%</strong> (={((customerRate * 0.9)).toFixed(1)}% tổng sàn),
              Admin giữ lại <strong>{100 - customerRate}%</strong> (={(((100 - customerRate) * 0.9)).toFixed(1)}% tổng sàn).
            </div>
          </div>

          {/* B. BỘ LỌC SÀN, TRẠNG THÁI, THỜI GIAN */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gridColumn: 'span 1' }}>
            {/* Lọc Sàn */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                NỀN TẢNG SÀN:
              </label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">🌐 Tất cả các sàn</option>
                <option value="Shopee">🟠 Shopee & Food</option>
                <option value="TikTok Shop">🎵 TikTok Shop</option>
                <option value="Lazada">🔵 Lazada</option>
              </select>
            </div>

            {/* Lọc Trạng thái */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                TRẠNG THÁI ĐƠN:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">📋 Tất cả trạng thái</option>
                <option value="COMPLETED">✅ Chỉ đơn hoàn thành</option>
                <option value="PENDING">⏳ Đang chờ xử lý</option>
              </select>
            </div>

            {/* Khung thời gian */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                KHUNG THỜI GIAN:
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="6m">📅 6 tháng gần nhất</option>
                <option value="12m">📅 12 tháng gần nhất</option>
                <option value="all">📅 Toàn bộ lịch sử</option>
              </select>
            </div>

            {/* Tiêu chí ngày */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                TIÊU CHÍ NGÀY:
              </label>
              <select
                value={dateBasis}
                onChange={(e) => setDateBasis(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '7px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <option value="purchase">🛒 Ngày đặt hàng</option>
                <option value="complete">🏁 Ngày hoàn thành</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. THẺ TỔNG HỢP CÁC CHỈ SỐ TÀI CHÍNH (SUMMARY CARDS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginTop: '16px'
      }}>
        {/* Card 1: Tổng đơn */}
        <div style={{
          background: 'var(--bg-main, #f8fafc)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: '600' }}>
            📦 Tổng Đơn Hàng
          </span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>
            {summaryKPIs.totalOrders.toLocaleString()} <small style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>đơn</small>
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Shopee: {summaryKPIs.shopeeOrders} | TikTok: {summaryKPIs.tiktokOrders}
          </span>
        </div>

        {/* Card 2: Hoa hồng sàn */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '700' }}>
            💰 Hoa Hồng Sàn (Gross)
          </span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#4338ca' }}>
            {formatMoney(summaryKPIs.grossComm)}
          </span>
          <span style={{ fontSize: '11.5px', color: '#6366f1' }}>
            100% doanh thu tiếp thị
          </span>
        </div>

        {/* Card 3: Thuế TNCN (10%) */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>
            🏛️ Thuế TNCN Sàn (10%)
          </span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#b91c1c' }}>
            {formatMoney(summaryKPIs.tax)}
          </span>
          <span style={{ fontSize: '11.5px', color: '#ef4444' }}>
            Sau thuế: {formatMoney(summaryKPIs.afterTax)}
          </span>
        </div>

        {/* Card 4: Khách nhận */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
            🎁 Khách Nhận ({customerRate}%)
          </span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#047857' }}>
            {formatMoney(summaryKPIs.customerCashback)}
          </span>
          <span style={{ fontSize: '11.5px', color: '#10b981' }}>
            Tiền hoàn trả cho thành viên
          </span>
        </div>

        {/* Card 5: Lợi nhuận Admin */}
        <div style={{
          background: 'rgba(249, 115, 22, 0.08)',
          border: '1.5px solid rgba(249, 115, 22, 0.35)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '700' }}>
            💼 Lợi Nhuận Admin ({100 - customerRate}%)
          </span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#c2410c' }}>
            {formatMoney(summaryKPIs.adminProfit)}
          </span>
          <span style={{ fontSize: '11.5px', color: '#f97316' }}>
            Doanh thu ròng của hệ thống
          </span>
        </div>

        {/* Card 6: Đã thanh toán thực tế */}
        <div style={{
          background: 'rgba(2, 132, 199, 0.06)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '700' }}>
            💳 Đã Thanh Toán (Thực tế)
          </span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#0369a1' }}>
            {formatMoney(summaryKPIs.actualWithdrawn)}
          </span>
          <span style={{ fontSize: '11.5px', color: '#38bdf8' }}>
            Đã duyệt chuyển khoản ví
          </span>
        </div>
      </div>

      {/* 4. BIỂU ĐỒ TRỰC QUAN (INTERACTIVE SVG CHART) */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #e2e8f0)',
        background: 'var(--bg-main, #f8fafc)',
        position: 'relative'
      }}>
        {/* Legend bật tắt cột */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px dashed var(--border-color, #e2e8f0)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '12px' }}>
            {chartView === 'cash' ? (
              <>
                <button
                  type="button"
                  onClick={() => toggleSeries('grossComm')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: visibleSeries.grossComm ? 1 : 0.4,
                    color: 'var(--text-main, #0f172a)',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#6366f1', display: 'inline-block' }}></span>
                  Hoa hồng sàn
                </button>

                <button
                  type="button"
                  onClick={() => toggleSeries('customerCashback')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: visibleSeries.customerCashback ? 1 : 0.4,
                    color: 'var(--text-main, #0f172a)',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
                  Khách nhận ({customerRate}%)
                </button>

                <button
                  type="button"
                  onClick={() => toggleSeries('adminProfit')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: visibleSeries.adminProfit ? 1 : 0.4,
                    color: 'var(--text-main, #0f172a)',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f97316', display: 'inline-block' }}></span>
                  Lợi nhuận Admin ({100 - customerRate}%)
                </button>

                <button
                  type="button"
                  onClick={() => toggleSeries('tax')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: visibleSeries.tax ? 1 : 0.4,
                    color: 'var(--text-main, #0f172a)',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }}></span>
                  Thuế TNCN (10%)
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text-main)' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ee4d2d', display: 'inline-block' }}></span>
                  Shopee
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text-main)' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0284c7', display: 'inline-block' }}></span>
                  TikTok Shop
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text-main)' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
                  Đơn hoàn thành
                </div>
              </>
            )}
          </div>

          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            💡 Rê chuột vào cột để xem chi tiết từng tháng
          </span>
        </div>

        {/* Khung vẽ SVG */}
        {monthlyData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-chart-column" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}></i>
            <p style={{ margin: 0 }}>Không tìm thấy dữ liệu đơn hàng trong khoảng thời gian đã chọn.</p>
          </div>
        ) : chartConfig && (
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <svg
              viewBox={`0 0 ${chartConfig.svgWidth} ${chartConfig.svgHeight}`}
              style={{ width: '100%', height: 'auto', minWidth: '680px', display: 'block' }}
            >
              {/* Định nghĩa Gradient đổ bóng thanh lịch */}
              <defs>
                <linearGradient id="gradGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <linearGradient id="gradCustomer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="gradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                <linearGradient id="gradTax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>

                <linearGradient id="gradShopee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#ee4d2d" />
                </linearGradient>
                <linearGradient id="gradTiktok" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>

              {/* Đường lưới ngang trục Y (Grid Lines) */}
              {chartConfig.yTicks.map((val, idx) => {
                const y = chartConfig.paddingTop + chartConfig.plotHeight - (val / chartConfig.maxVal) * chartConfig.plotHeight;
                return (
                  <g key={idx}>
                    <line
                      x1={chartConfig.paddingLeft}
                      y1={y}
                      x2={chartConfig.svgWidth - chartConfig.paddingRight}
                      y2={y}
                      stroke="var(--border-color, #e2e8f0)"
                      strokeDasharray={idx === 0 ? 'none' : '4 4'}
                      strokeWidth={idx === 0 ? '1.5' : '1'}
                    />
                    <text
                      x={chartConfig.paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="11"
                      fill="var(--text-muted, #64748b)"
                      fontWeight="500"
                    >
                      {chartView === 'cash' ? formatCompactNumber(val) : val}
                    </text>
                  </g>
                );
              })}

              {/* Vẽ từng nhóm cột theo tháng */}
              {monthlyData.map((d, mIdx) => {
                const groupX = chartConfig.paddingLeft + mIdx * chartConfig.groupWidth;
                const isHovered = hoveredMonth?.ym === d.ym;
                const isSelected = selectedMonth === d.ym;

                // Các chuỗi cột hiển thị trong chế độ 'cash'
                const activeCashSeries = [];
                if (visibleSeries.grossComm) activeCashSeries.push({ key: 'grossComm', val: d.grossComm, fill: 'url(#gradGross)' });
                if (visibleSeries.customerCashback) activeCashSeries.push({ key: 'customerCashback', val: d.customerCashback, fill: 'url(#gradCustomer)' });
                if (visibleSeries.adminProfit) activeCashSeries.push({ key: 'adminProfit', val: d.adminProfit, fill: 'url(#gradAdmin)' });
                if (visibleSeries.tax) activeCashSeries.push({ key: 'tax', val: d.tax, fill: 'url(#gradTax)' });

                // Các chuỗi cột trong chế độ 'orders'
                const activeOrderSeries = [
                  { key: 'shopee', val: d.shopeeOrders, fill: 'url(#gradShopee)' },
                  { key: 'tiktok', val: d.tiktokOrders, fill: 'url(#gradTiktok)' }
                ];

                const currentSeries = chartView === 'cash' ? activeCashSeries : activeOrderSeries;
                const seriesCount = currentSeries.length;
                const barWidth = seriesCount > 0 ? Math.max(8, Math.min(22, (chartConfig.availableGroupWidth / seriesCount) - 3)) : 10;
                const totalBarsWidth = seriesCount * barWidth + (seriesCount - 1) * 3;
                const startX = groupX + (chartConfig.groupWidth - totalBarsWidth) / 2;

                return (
                  <g
                    key={d.ym}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredMonth(d)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    onClick={() => setSelectedMonth(selectedMonth === d.ym ? null : d.ym)}
                  >
                    {/* Background highlight khi hover hoặc chọn */}
                    {(isHovered || isSelected) && (
                      <rect
                        x={groupX + 4}
                        y={chartConfig.paddingTop}
                        width={chartConfig.groupWidth - 8}
                        height={chartConfig.plotHeight}
                        fill={isSelected ? 'rgba(234, 88, 12, 0.12)' : 'rgba(100, 116, 139, 0.08)'}
                        rx="6"
                      />
                    )}

                    {/* Vẽ từng thanh bar */}
                    {currentSeries.map((s, sIdx) => {
                      const barHeight = chartConfig.maxVal > 0 ? (s.val / chartConfig.maxVal) * chartConfig.plotHeight : 0;
                      const barX = startX + sIdx * (barWidth + 3);
                      const barY = chartConfig.paddingTop + chartConfig.plotHeight - barHeight;

                      return (
                        <rect
                          key={s.key}
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={Math.max(2, barHeight)}
                          fill={s.fill}
                          rx="3"
                          ry="3"
                          style={{
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            filter: isHovered ? 'brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.2))' : 'none'
                          }}
                        />
                      );
                    })}

                    {/* Nhãn tháng trục X */}
                    <text
                      x={groupX + chartConfig.groupWidth / 2}
                      y={chartConfig.svgHeight - 14}
                      textAnchor="middle"
                      fontSize={isHovered || isSelected ? '12' : '11'}
                      fontWeight={isHovered || isSelected ? '800' : '600'}
                      fill={isSelected ? '#ea580c' : (isHovered ? 'var(--text-main, #0f172a)' : 'var(--text-muted, #64748b)')}
                    >
                      {d.ym.slice(5)}/{d.ym.slice(2, 4)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* 5. FLOATING TOOLTIP CHI TIẾT KHI RÊ HOẶC CHỌN THÁNG */}
        {activeHoverData && (
          <div style={{
            marginTop: '12px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid #ea580c',
            boxShadow: '0 8px 24px rgba(234, 88, 12, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#ea580c',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '800'
              }}>
                {activeHoverData.label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                Tổng: {activeHoverData.totalOrders} đơn (Shopee: {activeHoverData.shopeeOrders} | TikTok: {activeHoverData.tiktokOrders})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Sàn: </span>
                <strong style={{ color: '#4f46e5' }}>{formatMoney(activeHoverData.grossComm)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Thuế (10%): </span>
                <strong style={{ color: '#dc2626' }}>{formatMoney(activeHoverData.tax)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Khách ({customerRate}%): </span>
                <strong style={{ color: '#059669' }}>{formatMoney(activeHoverData.customerCashback)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Admin ({100 - customerRate}%): </span>
                <strong style={{ color: '#ea580c' }}>{formatMoney(activeHoverData.adminProfit)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Đã rút thực tế: </span>
                <strong style={{ color: '#0284c7' }}>{formatMoney(activeHoverData.actualWithdrawn)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. BẢNG THỐNG KÊ CHI TIẾT THEO TỪNG THÁNG (BREAKDOWN TABLE) */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
            <i className="fa-solid fa-table-list" style={{ color: '#f97316', marginRight: '6px' }}></i>
            Bảng Chi Tiết Doanh Thu & Phân Bổ Hoa Hồng Từng Tháng
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Hiển thị {monthlyData.length} tháng gần nhất
          </span>
        </div>

        <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '940px', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '2px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Tháng</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700' }}>Số đơn</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#4f46e5' }}>Hoa hồng sàn</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#dc2626' }}>Thuế TNCN (10%)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700' }}>Sau thuế (90%)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#059669', background: 'rgba(16, 185, 129, 0.05)' }}>
                  Khách nhận ({customerRate}%)
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#ea580c', background: 'rgba(249, 115, 22, 0.05)' }}>
                  Lợi nhuận Admin ({100 - customerRate}%)
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#0284c7' }}>Đã rút thực tế</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700' }}>Chênh lệch ví</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Không có dữ liệu trong khoảng thời gian này
                  </td>
                </tr>
              ) : (
                // Hiển thị tháng mới nhất lên trước trong bảng để tiện theo dõi
                [...monthlyData].reverse().map(d => {
                  const isRowSelected = selectedMonth === d.ym;
                  return (
                    <tr
                      key={d.ym}
                      onClick={() => setSelectedMonth(isRowSelected ? null : d.ym)}
                      style={{
                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                        background: isRowSelected ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {isRowSelected && <span style={{ color: '#ea580c' }}>▶</span>}
                          {d.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <strong>{d.totalOrders}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          SP: {d.shopeeOrders} | TT: {d.tiktokOrders}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#4f46e5' }}>
                        {formatMoney(d.grossComm)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#dc2626' }}>
                        {formatMoney(d.tax)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-main)' }}>
                        {formatMoney(d.afterTax)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#059669', background: 'rgba(16, 185, 129, 0.05)' }}>
                        {formatMoney(d.customerCashback)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#ea580c', background: 'rgba(249, 115, 22, 0.05)' }}>
                        {formatMoney(d.adminProfit)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0284c7' }}>
                        {formatMoney(d.actualWithdrawn)}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: d.diffWithdrawn >= 0 ? '#10b981' : '#f43f5e'
                      }}>
                        {d.diffWithdrawn >= 0 ? `+${formatMoney(d.diffWithdrawn)}` : `-${formatMoney(Math.abs(d.diffWithdrawn))}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Dòng Tổng cộng */}
            {monthlyData.length > 0 && (
              <tfoot>
                <tr style={{
                  background: 'var(--bg-main, #f1f5f9)',
                  borderTop: '2px solid var(--border-color, #cbd5e1)',
                  fontWeight: '800'
                }}>
                  <td style={{ padding: '12px', color: 'var(--text-main)' }}>TỔNG CỘNG</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{summaryKPIs.totalOrders.toLocaleString()} đơn</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#4f46e5' }}>{formatMoney(summaryKPIs.grossComm)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#dc2626' }}>{formatMoney(summaryKPIs.tax)}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{formatMoney(summaryKPIs.afterTax)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#059669', background: 'rgba(16, 185, 129, 0.1)' }}>
                    {formatMoney(summaryKPIs.customerCashback)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#ea580c', background: 'rgba(249, 115, 22, 0.1)' }}>
                    {formatMoney(summaryKPIs.adminProfit)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#0284c7' }}>{formatMoney(summaryKPIs.actualWithdrawn)}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: (summaryKPIs.customerCashback - summaryKPIs.actualWithdrawn) >= 0 ? '#10b981' : '#f43f5e' }}>
                    {formatMoney(summaryKPIs.customerCashback - summaryKPIs.actualWithdrawn)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
