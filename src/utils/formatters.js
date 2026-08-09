// Các hàm tiện ích dùng chung toàn bộ dự án admin-frontend

/**
 * Format số tiền VNĐ (làm tròn về ngàn, thêm dấu chấm phân cách)
 */
export const formatMoney = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0đ';
  return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
};

/**
 * Format chuỗi ngày giờ thành "dd/MM HH:mm"
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr.replace('T', ' ').substring(0, 16);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Parse chuỗi bankInfo cũ dạng "BANKNAME 12345678" thành { bankName, accountNumber }
 */
export const parseBankInfo = (bankInfo) => {
  if (!bankInfo) return { bankName: '', accountNumber: '' };
  const raw = bankInfo.trim();
  const parts = raw.split(/[\s_\-]+/);
  if (parts.length >= 2) {
    const accountNumber = parts[parts.length - 1];
    const bankName = parts.slice(0, parts.length - 1).join(' ');
    return { bankName, accountNumber };
  } else {
    const match = raw.match(/^([a-zA-Z\s]+)(\d+)$/);
    if (match) {
      return { bankName: match[1].trim(), accountNumber: match[2].trim() };
    }
    return { bankName: 'UNKNOWN', accountNumber: raw };
  }
};

/**
 * Lấy bankName và accountNumber từ một user hoặc payout object
 */
export const getBankAndAccount = (item) => {
  if (!item) return { bankName: '', accountNumber: '' };
  if (item.bankName && item.bankName !== 'UNKNOWN' && item.accountNumber) {
    return { bankName: item.bankName, accountNumber: item.accountNumber };
  }
  if (item.bankInfo) {
    const parsed = parseBankInfo(item.bankInfo);
    if (parsed.bankName && parsed.bankName !== 'UNKNOWN') {
      return parsed;
    }
    return {
      bankName: item.bankName && item.bankName !== 'UNKNOWN' ? item.bankName : parsed.bankName,
      accountNumber: item.accountNumber || parsed.accountNumber
    };
  }
  return {
    bankName: item.bankName || '',
    accountNumber: item.accountNumber || ''
  };
};
