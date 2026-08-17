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
export const formatDateTime = (val) => {
  if (!val) return '-';
  try {
    // 1. Array from Jackson LocalDateTime serialization: [2026, 8, 15, 12, 27, 2]
    if (Array.isArray(val)) {
      const [year, month, day, hour = 0, minute = 0] = val;
      const dStr = String(day).padStart(2, '0');
      const mStr = String(month).padStart(2, '0');
      const hStr = String(hour).padStart(2, '0');
      const minStr = String(minute).padStart(2, '0');
      return `${dStr}/${mStr} ${hStr}:${minStr}`;
    }

    const strVal = String(val).trim();

    // 2. Comma separated numbers: "2026,8,15,12,27,2"
    if (strVal.includes(',')) {
      const parts = strVal.split(',').map(n => parseInt(n.trim(), 10));
      if (parts.length >= 3 && !parts.some(isNaN)) {
        const [year, month, day, hour = 0, minute = 0] = parts;
        const dStr = String(day).padStart(2, '0');
        const mStr = String(month).padStart(2, '0');
        const hStr = String(hour).padStart(2, '0');
        const minStr = String(minute).padStart(2, '0');
        return `${dStr}/${mStr} ${hStr}:${minStr}`;
      }
    }

    // 3. Raw concatenated digits e.g. "202681512272" or "20268684323"
    if (/^\d{10,14}$/.test(strVal) && strVal.startsWith('2026')) {
      const year = strVal.substring(0, 4);
      const rest = strVal.substring(4);
      if (rest.startsWith('8')) {
        const month = '08';
        const dayRest = rest.substring(1);
        if (dayRest.length >= 6) {
          const day = dayRest.length === 7 ? dayRest.substring(0, 2) : '0' + dayRest.substring(0, 1);
          const timeRest = dayRest.length === 7 ? dayRest.substring(2) : dayRest.substring(1);
          const hour = timeRest.length >= 4 ? timeRest.substring(0, 2) : '0' + timeRest.substring(0, 1);
          const minRest = timeRest.length >= 4 ? timeRest.substring(2) : timeRest.substring(1);
          const min = minRest.substring(0, 2);
          return `${day}/${month} ${hour}:${min}`;
        }
      }
    }

    // 4. Standard Date parsing (ISO string or Timestamp)
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} ${hours}:${minutes}`;
    }

    return strVal.replace('T', ' ').substring(0, 16);
  } catch (e) {
    return String(val);
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
