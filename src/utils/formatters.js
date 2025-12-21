// Formatting utilities

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

export const formatRollNo = (rollNo) => {
  if (!rollNo) return '';
  return rollNo.toUpperCase();
};

export const formatCourseCode = (code) => {
  if (!code) return '';
  return code.toUpperCase();
};

export const formatPercentage = (value, total) => {
  if (!total || total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

export const truncateString = (str, maxLength = 20) => {
  if (!str || str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
};