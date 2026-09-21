// Test getConditionStatusLabel vs getVtsConditionStatusLabel
const getConditionStatusLabel = (status) => {
  if (!status || status === '—') return '';
  const s = String(status).trim();
  const norm = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

  if (norm.includes('chua khai thac') || norm.includes('chua hoat dong') || norm === 'not_yet_operational' || norm === '0') {
    return 'Chưa khai thác/vận hành';
  }
  if (norm.includes('tam dung') || norm.includes('dung') || norm.includes('suspended') || norm === '2') {
    return 'Tạm dừng hoạt động';
  }
  if (norm.includes('bao tri') || norm.includes('maintenance') || norm === '4') {
    return 'Đang bảo trì';
  }
  if (norm.includes('xay dung') || norm.includes('construction') || norm === 'under_construction' || norm === '3') {
    return 'Đang xây dựng';
  }
  if (norm.includes('hoat dong') || norm === 'operational' || norm === 'active' || norm === 'good' || norm === '1') {
    return 'Đang hoạt động';
  }
  return s;
};

const getVtsConditionStatusLabel = (status) => {
  if (status == null || status === '' || status === '—') return '';
  const s = String(status).trim();
  const norm = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

  if (norm.includes('chua khai thac') || norm.includes('chua hoat dong')
    || norm === 'not_yet_operational' || norm === 'chua_khai_thac'
    || norm.includes('xay dung') || norm === 'under_construction' || norm === '3' || norm === '4') {
    return 'Chưa khai thác/vận hành';
  }
  if (norm.includes('dung khai thac') || norm.includes('dung hoat dong') || norm.includes('ngung')
    || norm.includes('tam dung') || norm.includes('khong hoat dong')
    || norm === 'suspended' || norm === 'stopped' || norm === 'not_operational'
    || norm === 'dung_khai_thac' || norm === '1' || norm === '5') {
    return 'Dừng khai thác/vận hành';
  }
  if (norm.includes('bao tri') || norm.includes('maintenance') || norm === '2') {
    return 'Đang bảo trì';
  }
  if (norm.includes('dang khai thac') || norm.includes('dang hoat dong')
    || norm === 'operational' || norm === 'dang_khai_thac' || norm === '0') {
    return 'Đang khai thác/vận hành';
  }
  return 'Đang khai thác/vận hành';
};

console.log('Old val (VTS):', getVtsConditionStatusLabel('Dừng hoạt động'));
console.log('New val (VTS):', getVtsConditionStatusLabel('Đang xây dựng'));

console.log('Old val (Standard):', getConditionStatusLabel('Dừng hoạt động'));
console.log('New val (Standard):', getConditionStatusLabel('Đang xây dựng'));
