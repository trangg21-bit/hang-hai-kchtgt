import { describe, expect, it } from 'vitest';
import { parseWharfAreaHistory, renderWharfAreaHistory } from '../utils/changeHistoryRenderer';

describe('Port Wharf Area History Parsing & Rendering', () => {
  it('xử lý chuỗi rỗng, null hoặc gạch ngang đúng cách', () => {
    expect(parseWharfAreaHistory('')).toEqual([]);
    expect(parseWharfAreaHistory(null)).toEqual([]);
    expect(parseWharfAreaHistory(undefined)).toEqual([]);
    expect(parseWharfAreaHistory('—')).toEqual([]);
    expect(parseWharfAreaHistory('-')).toEqual([]);
    expect(renderWharfAreaHistory('')).toBe('');
    expect(renderWharfAreaHistory(null)).toBe('');
  });

  it('phân tích định dạng mới đầy đủ tất cả các trường của 1 khu bến', () => {
    const raw = 'Tên: Khu bến Cái Mép | Mã: VNCMU-KB01 | Chức năng: Đón tàu container xuất nhập khẩu | Phạm vi: Hạ lưu sông Cái Mép | Văn bản: QĐ số 1579/QĐ-TTg | Ghi chú: Hoạt động ổn định';
    const items = parseWharfAreaHistory(raw);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      name: 'Khu bến Cái Mép',
      code: 'VNCMU-KB01',
      func: 'Đón tàu container xuất nhập khẩu',
      scope: 'Hạ lưu sông Cái Mép',
      doc: 'QĐ số 1579/QĐ-TTg',
      notes: 'Hoạt động ổn định',
    });
  });

  it('phân tích chính xác khi cảng biển có nhiều khu bến (ngăn cách bởi ;\\n)', () => {
    const raw = [
      'Tên: Khu bến Cái Mép | Mã: VNCMU-KB01 | Chức năng: Đón tàu container | Phạm vi: Hạ lưu sông Cái Mép | Văn bản: QĐ 1579 | Ghi chú: Đang vận hành;',
      'Tên: Khu bến Thị Vải | Mã: VNCMU-KB02 | Chức năng: Đón tàu hàng rời | Phạm vi: Thượng lưu sông Thị Vải | Văn bản: QĐ 1579 | Ghi chú: Quy hoạch mở rộng',
    ].join('\n');

    const items = parseWharfAreaHistory(raw);
    expect(items).toHaveLength(2);

    expect(items[0].name).toBe('Khu bến Cái Mép');
    expect(items[0].code).toBe('VNCMU-KB01');
    expect(items[0].func).toBe('Đón tàu container');
    expect(items[0].scope).toBe('Hạ lưu sông Cái Mép');
    expect(items[0].doc).toBe('QĐ 1579');
    expect(items[0].notes).toBe('Đang vận hành');

    expect(items[1].name).toBe('Khu bến Thị Vải');
    expect(items[1].code).toBe('VNCMU-KB02');
    expect(items[1].func).toBe('Đón tàu hàng rời');
    expect(items[1].scope).toBe('Thượng lưu sông Thị Vải');
    expect(items[1].doc).toBe('QĐ 1579');
    expect(items[1].notes).toBe('Quy hoạch mở rộng');
  });

  it('tương thích ngược hoàn hảo với định dạng cũ chỉ có tên và mã', () => {
    const rawLegacy = 'Khu bến Cái Mép (VNCMU01)';
    const items = parseWharfAreaHistory(rawLegacy);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Khu bến Cái Mép');
    expect(items[0].code).toBe('VNCMU01');
  });

  it('tương thích ngược với nhiều khu bến theo định dạng cũ phân cách bởi dấu phẩy', () => {
    const rawLegacyMulti = 'Khu bến Cái Mép (VNCMU01), Khu bến Thị Vải (VNCMU02)';
    const items = parseWharfAreaHistory(rawLegacyMulti);
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('Khu bến Cái Mép');
    expect(items[0].code).toBe('VNCMU01');
    expect(items[1].name).toBe('Khu bến Thị Vải');
    expect(items[1].code).toBe('VNCMU02');
  });

  it('renderWharfAreaHistory trả về React node khi có dữ liệu', () => {
    const raw = 'Tên: Khu bến Cái Mép | Mã: VNCMU-KB01 | Chức năng: Đón tàu';
    const node = renderWharfAreaHistory(raw);
    expect(node).not.toBe('');
    expect(node).toBeDefined();
  });
});
