import { describe, expect, it } from 'vitest';
import {
  normalizeHistoryKey,
  histField,
  histVal,
  formatPierHistoryValue,
} from '../pages/port/PierListPage';
import {
  historyFieldName,
  historyFieldValue,
  formatBerthHistoryValue,
} from '../pages/port/BerthListPage';

describe('Ánh xạ trường và giá trị lịch sử Cầu cảng (Pier)', () => {
  it('chuẩn hóa key tìm kiếm lịch sử không phân biệt dấu và hoa thường', () => {
    expect(normalizeHistoryKey('structureType')).toBe('structuretype');
    expect(normalizeHistoryKey('Loại kết cấu')).toBe('loai ket cau');
    expect(normalizeHistoryKey('Loại kết cấu cầu cảng')).toBe('loai ket cau cau cang');
    expect(normalizeHistoryKey('Đơn vị quản lý')).toBe('don vi quan ly');
  });

  it('ánh xạ tên trường sang tiếng Việt chính xác', () => {
    expect(histField('structureType')).toBe('Loại kết cấu');
    expect(histField('structuretype')).toBe('Loại kết cấu');
    expect(histField('loai ket cau')).toBe('Loại kết cấu');
    expect(histField('constructionGrade')).toBe('Cấp công trình');
  });

  it('dịch mã loại kết cấu 1, 2, 3, 4 sang tên tiếng Việt thay vì để số thô', () => {
    expect(histVal('structureType', '1')).toBe('Kết cấu bệ cọc cao');
    expect(histVal('structureType', '2')).toBe('Kết cấu cường từ');
    expect(histVal('structureType', '3')).toBe('Kết cấu trọng lực');
    expect(histVal('structureType', '4')).toBe('Kết cấu khác');

    // Cùng hoạt động khi field name là tiếng Việt hoặc snake_case
    expect(histVal('structure_type', '1')).toBe('Kết cấu bệ cọc cao');
    expect(histVal('loai ket cau', '2')).toBe('Kết cấu cường từ');
    expect(histVal('Loại kết cấu cầu cảng', '3')).toBe('Kết cấu trọng lực');
  });

  it('formatPierHistoryValue không bị regex số ghi đè loại kết cấu về số 1 2', () => {
    expect(formatPierHistoryValue('structureType', '1')).toBe('Kết cấu bệ cọc cao');
    expect(formatPierHistoryValue('structureType', '2')).toBe('Kết cấu cường từ');
    expect(formatPierHistoryValue('structureType', '3')).toBe('Kết cấu trọng lực');
    expect(formatPierHistoryValue('structureType', '4')).toBe('Kết cấu khác');
    expect(formatPierHistoryValue('loai ket cau', '1')).toBe('Kết cấu bệ cọc cao');
  });

  it('formatPierHistoryValue vẫn định dạng đúng các trường số thuần túy', () => {
    expect(formatPierHistoryValue('length', '150')).toBe('150');
    expect(formatPierHistoryValue('width', '25.5')).toBe('25.5');
    expect(formatPierHistoryValue('cargoThroughput', '1000000')).toBe('1,000,000');
  });

  it('dịch phân cấp công trình và tình trạng hoạt động chính xác', () => {
    expect(histVal('constructionGrade', '1')).toBe('Cấp đặc biệt');
    expect(histVal('constructionGrade', '2')).toBe('Cấp 1');
    expect(histVal('conditionStatus', '1')).toBe('Đang hoạt động');
    expect(histVal('conditionStatus', '2')).toBe('Đang bảo trì');
    expect(histVal('approvalStatus', 'DRAFT')).toBe('Lưu tạm');
    expect(histVal('receivesLargeVessel', 'true')).toBe('Có');
  });
});

describe('Ánh xạ trường và giá trị lịch sử Bến cảng (Berth)', () => {
  it('ánh xạ tên trường và loại kết cấu bến cảng chính xác', () => {
    expect(historyFieldName('structureType')).toBe('Loại kết cấu bến cảng');
    expect(historyFieldValue('structureType', '1')).toBe('Kết cấu bệ cọc cao');
    expect(historyFieldValue('structureType', '2')).toBe('Kết cấu cường từ');
    expect(historyFieldValue('structureType', '3')).toBe('Kết cấu trọng lực');
    expect(historyFieldValue('structureType', '4')).toBe('Kết cấu khác');
  });

  it('formatBerthHistoryValue không bị regex số ghi đè loại kết cấu về số 1 2', () => {
    expect(formatBerthHistoryValue('structureType', '1')).toBe('Kết cấu bệ cọc cao');
    expect(formatBerthHistoryValue('structureType', '2')).toBe('Kết cấu cường từ');
    expect(formatBerthHistoryValue('structureType', '3')).toBe('Kết cấu trọng lực');
    expect(formatBerthHistoryValue('structureType', '4')).toBe('Kết cấu khác');
  });

  it('dịch mã công năng khai thác của bến cảng sang nhãn tiếng Việt', () => {
    expect(historyFieldValue('operationalFunction', 'CONTAINER')).toBe('Hàng Container');
    expect(historyFieldValue('operationalFunction', 'GENERAL_CARGO')).toBe('Hàng tổng hợp (bách hóa)');
    expect(formatBerthHistoryValue('operationalFunction', 'CONTAINER,PASSENGER')).toBe('Hàng Container, Hàng khách');
    expect(formatBerthHistoryValue('operationalFunction', 'OIL_GAS')).toBe('Hàng chuyên dụng xăng dầu, khí hóa lỏng');
  });

  it('dịch mã thuộc luồng hàng hải của bến cảng sang tên luồng', () => {
    const waterwayMap = new Map([['chan-1', 'Luồng hàng hải Vũng Tàu - Thị Vải']]);
    expect(historyFieldValue('waterwayId', 'chan-1', undefined, undefined, undefined, waterwayMap)).toBe('Luồng hàng hải Vũng Tàu - Thị Vải');
    expect(formatBerthHistoryValue('waterwayId', 'chan-1', undefined, undefined, undefined, waterwayMap)).toBe('Luồng hàng hải Vũng Tàu - Thị Vải');
  });
});
