export function parseCongNangKhaiThac(value: string | null | undefined): string[] {
  if (!value) return [];
  
  const standardOptions = [
    'Hàng Container',
    'Hàng tổng hợp (bách hóa)',
    'Hàng chuyên dụng hàng rời, quặng',
    'Hàng chuyên dụng xăng dầu, khí hóa lỏng',
    'Hàng chuyên dụng khác (dịch vụ, đóng, sửa chữa tàu ...)',
    'Hành khách'
  ];

  let remaining = value.trim();
  const result: string[] = [];

  // Match standard options first (exact matching to avoid comma splitting issue)
  standardOptions.forEach(opt => {
    // Escape regex characters
    const escaped = opt.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|\\s*,\\s*)${escaped}(\\s*,\\s*|$)`, 'i');
    if (regex.test(remaining)) {
      result.push(opt);
      // Remove it from the string
      remaining = remaining.replace(regex, (match, p1, p2) => {
        if (p1 && p2) return ', ';
        return '';
      }).trim();
    }
  });

  // Parse remaining custom options
  if (remaining) {
    remaining.split(',').forEach(item => {
      const trimmed = item.trim();
      if (trimmed) {
        result.push(trimmed);
      }
    });
  }

  return result;
}
