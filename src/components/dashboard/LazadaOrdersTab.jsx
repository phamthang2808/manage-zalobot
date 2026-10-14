import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney, formatDateTime } from '../../utils/formatters';

export default function LazadaOrdersTab({ onCountUpdate }) {
  const { API_URL_ROOT, showToast } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Assign modal state
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);
  const [assignIdentifier, setAssignIdentifier] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchLazadaOrders = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/orders/lazada`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data || []);
        if (onCountUpdate) onCountUpdate((data || []).length);
      } else {
        showToast(data.message || 'Lỗi tải đơn hàng Lazada', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải đơn hàng Lazada', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLazadaOrders();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    setImportResult(null);

    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/orders/import-lazada`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi import file Lazada');

      setImportResult(data);
      showToast(`Đã import thành công ${data.newOrders || 0} đơn mới, cập nhật ${data.updatedOrders || 0} đơn! 🎉`, 'success');
      fetchLazadaOrders();
    } catch (err) {
      showToast(err.message || 'Lỗi khi import file', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAssignOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrderForAssign || !assignIdentifier.trim()) {
      showToast('Vui lòng nhập ID thành viên hoặc Zalo ID!', 'warning');
      return;
    }

    setAssigning(true);
    try {
      const token = sessionStorage.getItem('adminToken') || '';
      const res = await fetch(`${API_URL_ROOT}/api/admin/orders/lazada/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: selectedOrderForAssign.orderId,
          targetIdentifier: assignIdentifier.trim()
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi gán đơn');

      showToast(data.message || 'Đã gán đơn hàng thành công!', 'success');
      setSelectedOrderForAssign(null);
      setAssignIdentifier('');
      fetchLazadaOrders();
    } catch (err) {
      showToast(err.message || 'Lỗi gán đơn', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'COMPLETED' && o.status !== 'Hoàn thành') return false;
    if (statusFilter === 'PENDING' && o.status !== 'Đang xử lý' && o.status !== 'Chờ xử lý') return false;
    if (statusFilter === 'CANCELLED' && o.status !== 'Đã hủy' && o.status !== 'Hủy') return false;

    if (dateFilter !== 'ALL' && o.purchaseTime) {
      const pDate = new Date(o.purchaseTime);
      const now = new Date();
      if (dateFilter === 'TODAY' && pDate.toDateString() !== now.toDateString()) return false;
      if (dateFilter === 'YESTERDAY') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        if (pDate.toDateString() !== yest.toDateString()) return false;
      }
      if (dateFilter === '7DAYS') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        if (pDate < d7) return false;
      }
      if (dateFilter === 'THIS_MONTH') {
        if (pDate.getMonth() !== now.getMonth() || pDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = String(o.orderId || '').toLowerCase().includes(q);
      const matchName = String(o.productName || '').toLowerCase().includes(q);
      const matchSub = String(o.subId || '').toLowerCase().includes(q);
      const matchZalo = String(o.zaloId || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchSub && !matchZalo) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const displayedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPayout = orders.reduce((acc, o) => acc + (o.payout || o.commission || 0), 0);
  const completedOrdersCount = orders.filter(o => o.status === 'Hoàn thành').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Đang xử lý' || o.status === 'Chờ xử lý').length;

  return (
    <div className="lazada-orders-tab-container" style={{ padding: '4px 0' }}>
      {/* 4 Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Tổng Đơn Lazada
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#2563eb', marginTop: '4px' }}>
            {orders.length} đơn
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
            Tổng đơn Lazada đã đồng bộ
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Đơn Hoàn Thành
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
            {completedOrdersCount} đơn
          </div>
          <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', marginTop: '2px' }}>
            Đã thanh toán hoa hồng
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Đang Xử Lý / Chờ Duyệt
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#d97706', marginTop: '4px' }}>
            {pendingOrdersCount} đơn
          </div>
          <div style={{ fontSize: '11.5px', color: '#d97706', fontWeight: '700', marginTop: '2px' }}>
            Đang trong chu kỳ đối soát
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #fff)', border: '1.5px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
            Tổng Payout Lazada
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#ea580c', marginTop: '4px' }}>
            {formatMoney(totalPayout)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
            Tổng hoa hồng ghi nhận
          </div>
        </div>
      </div>

      {/* Import Excel Card */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
        border: '1.5px solid #bfdbfe',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
            <i className="fa-solid fa-file-excel"></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e3a8a' }}>
              📥 Import Báo Cáo Đối Soát Lazada (Excel / CSV)
            </h4>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#475569' }}>
              Tải file báo cáo đối soát từ Lazada Portal để tự động cập nhật trạng thái đơn, hoa hồng và cộng số dư thành viên.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: importing ? '#94a3b8' : '#2563eb',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: importing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            {importing ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Đang xử lý file...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-upload"></i>
                <span>Chọn File Excel Lazada</span>
              </>
            )}
          </button>
        </div>
      </div>

      {importResult && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#15803d',
          fontWeight: '700'
        }}>
          ✓ Kết quả import: Đọc <b>{importResult.totalRows}</b> dòng • Thêm mới <b>{importResult.newOrders}</b> đơn • Cập nhật <b>{importResult.updatedOrders}</b> đơn • Tổng Payout: <b>{formatMoney(importResult.totalPayout)}</b>.
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8', fontSize: '13px' }}></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo mã đơn Lazada, tên sản phẩm, SubID..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-bright, #0f172a)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: '700' }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="PENDING">Đang xử lý</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: '700' }}
          >
            <option value="ALL">Tất cả ngày</option>
            <option value="TODAY">Hôm nay</option>
            <option value="YESTERDAY">Hôm qua</option>
            <option value="7DAYS">7 ngày qua</option>
            <option value="THIS_MONTH">Tháng này</option>
          </select>

          <button
            type="button"
            onClick={fetchLazadaOrders}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-main, #f8fafc)',
              color: 'var(--text-bright, #0f172a)',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        background: 'var(--bg-card, #fff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
            <div>Đang tải danh sách đơn Lazada...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '13.5px' }}>Không tìm thấy đơn hàng Lazada nào phù hợp.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main, #f8fafc)', borderBottom: '1.5px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Nguồn</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Mã đơn Lazada</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Sản phẩm</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Sub ID / Thành viên</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Payout</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Thời gian</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map((o) => {
                    const isWeb = o.source === 'WEB';
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          {isWeb ? (
                            <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#ede9fe', color: '#7c3aed', fontSize: '10px', fontWeight: '800' }}>
                              🌐 Web
                            </span>
                          ) : (
                            <span style={{ padding: '2px 6px', borderRadius: '4px', background: '#dbeafe', color: '#2563eb', fontSize: '10px', fontWeight: '800' }}>
                              💬 Zalo
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12.5px', fontWeight: '800', color: 'var(--text-bright, #0f172a)' }}>
                          {o.orderId}
                        </td>

                        <td style={{ padding: '12px 16px', maxWidth: '300px' }} title={o.productName}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {o.imageUrl ? (
                              <img
                                src={o.imageUrl}
                                alt={o.productName || 'Ảnh sản phẩm'}
                                referrerPolicy="no-referrer"
                                style={{
                                  width: '44px',
                                  height: '44px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-color, #cbd5e1)',
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
                                width: '44px',
                                height: '44px',
                                borderRadius: '8px',
                                background: 'var(--bg-main, #f1f5f9)',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                display: o.imageUrl ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: 'var(--text-muted, #94a3b8)'
                              }}
                            >
                              <i className="fa-solid fa-bag-shopping" style={{ fontSize: '16px', opacity: 0.6 }}></i>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-bright, #0f172a)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                              {o.productName || 'Sản phẩm Lazada'}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                          {o.subId ? (
                            <code style={{ background: 'var(--bg-main, #f1f5f9)', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>
                              {o.subId}
                            </code>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có</span>
                          )}
                          {o.zaloId && <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>Zalo: {o.zaloId}</div>}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '800', color: '#ea580c', fontSize: '13.5px' }}>
                          {formatMoney(o.payout || o.commission)}
                        </td>

                        <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {formatDateTime(o.purchaseTime)}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            background: o.status === 'Hoàn thành' ? '#ecfdf5' : (o.status === 'Đã hủy' || o.status === 'Hủy') ? '#fef2f2' : '#fffbeb',
                            color: o.status === 'Hoàn thành' ? '#059669' : (o.status === 'Đã hủy' || o.status === 'Hủy') ? '#e11d48' : '#d97706'
                          }}>
                            {o.status || 'Đang xử lý'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => { setSelectedOrderForAssign(o); setAssignIdentifier(String(o.userId || o.zaloId || o.subId || '')); }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#fff',
                              color: '#2563eb',
                              fontSize: '11.5px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                            title="Gán đơn hàng cho thành viên"
                          >
                            <i className="fa-solid fa-user-tag" style={{ marginRight: '4px' }}></i>
                            Gán đơn
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-main, #f8fafc)' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} / {filteredOrders.length} đơn
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', fontWeight: '700', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Trước
                  </button>
                  <span style={{ fontSize: '12px', fontWeight: '800', padding: '4px 8px' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', fontWeight: '700', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Order Modal */}
      {selectedOrderForAssign && (
        <div className="modal-overlay" onClick={() => setSelectedOrderForAssign(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
          backdropFilter: 'blur(4px)'
        }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #fff)',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '800' }}>
              🎯 Gán Đơn Hàng Lazada #{selectedOrderForAssign.orderId}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#64748b' }}>
              Nhập ID thành viên Web (ví dụ: 12), Email hoặc Zalo ID để gán hoa hồng đơn này cho người nhận:
            </p>

            <form onSubmit={handleAssignOrder}>
              <input
                type="text"
                value={assignIdentifier}
                onChange={(e) => setAssignIdentifier(e.target.value)}
                placeholder="Nhập ID thành viên, Email hoặc Zalo ID..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForAssign(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '800', cursor: assigning ? 'not-allowed' : 'pointer' }}
                >
                  {assigning ? 'Đang gán...' : 'Gán Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
