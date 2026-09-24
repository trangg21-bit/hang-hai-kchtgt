import { describe, it, expect } from 'vitest';
import { formatNumber, isBeaconNumericField } from './BeaconStationList';

describe('BeaconStation Number Formatting vi-VN (/beacon-stations)', () => {
  describe('formatNumber utility', () => {
    it('định dạng số nguyên có dấu chấm "." phân tách hàng nghìn', () => {
      expect(formatNumber(1000)).toBe('1.000');
      expect(formatNumber(25000)).toBe('25.000');
      expect(formatNumber(1000000)).toBe('1.000.000');
      expect(formatNumber('5000')).toBe('5.000');
      expect(formatNumber(4)).toBe('4');
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber('0')).toBe('0');
    });

    it('định dạng số thập phân với dấu chấm "." hàng nghìn và dấu phẩy "," thập phân', () => {
      expect(formatNumber(1234.56)).toBe('1.234,56');
      expect(formatNumber('1234.56')).toBe('1.234,56');
      expect(formatNumber('1234,56')).toBe('1.234,56');
      expect(formatNumber(25.5)).toBe('25,5');
      expect(formatNumber('25.5000')).toBe('25,5');
      expect(formatNumber(1500000.75)).toBe('1.500.000,75');
    });

    it('xử lý chuỗi số lớn và các trường hợp đặc biệt không bị mất độ chính xác', () => {
      expect(formatNumber('99999999999999999999')).toBe('99.999.999.999.999.999.999');
      expect(formatNumber('100000000000000000000')).toBe('99.999.999.999.999.999.999');
      expect(formatNumber(null)).toBeNull();
      expect(formatNumber(undefined)).toBeNull();
      expect(formatNumber('')).toBeNull();
    });

    it('giới hạn số chữ số thập phân tối đa theo tham số maxFractionDigits', () => {
      expect(formatNumber(12.3456789, 4)).toBe('12,3456');
      expect(formatNumber('12.3456789', 2)).toBe('12,34');
    });
  });

  describe('isBeaconNumericField recognition', () => {
    it('nhận diện chính xác 6 trường số cả tên tiếng Anh lẫn nhãn tiếng Việt', () => {
      // 1. Chiều cao tháp đèn (m)
      expect(isBeaconNumericField('towerHeight')).toBe(true);
      expect(isBeaconNumericField('Chiều cao tháp đèn (m)')).toBe(true);
      expect(isBeaconNumericField('Chiều cao tháp đèn')).toBe(true);
      expect(isBeaconNumericField('chieu cao thap den')).toBe(true);

      // 2. Chiều cao tâm sáng (m)
      expect(isBeaconNumericField('lightHeight')).toBe(true);
      expect(isBeaconNumericField('Chiều cao tâm sáng (m)')).toBe(true);
      expect(isBeaconNumericField('Chiều cao tâm sáng')).toBe(true);
      expect(isBeaconNumericField('chieu cao tam sang')).toBe(true);

      // 3. Tầm hiệu lực ánh sáng
      expect(isBeaconNumericField('lightRange')).toBe(true);
      expect(isBeaconNumericField('Tầm hiệu lực ánh sáng')).toBe(true);
      expect(isBeaconNumericField('Tầm hiệu lực ánh sáng (hải lý)')).toBe(true);
      expect(isBeaconNumericField('tam hieu luc anh sang')).toBe(true);

      // 4. Diện tích (m²)
      expect(isBeaconNumericField('area')).toBe(true);
      expect(isBeaconNumericField('Diện tích (m²)')).toBe(true);
      expect(isBeaconNumericField('Diện tích')).toBe(true);
      expect(isBeaconNumericField('dien tich')).toBe(true);

      // 5. Diện tích sử dụng trạm đèn (m²)
      expect(isBeaconNumericField('stationArea')).toBe(true);
      expect(isBeaconNumericField('Diện tích sử dụng trạm đèn (m²)')).toBe(true);
      expect(isBeaconNumericField('Diện tích sử dụng trạm')).toBe(true);
      expect(isBeaconNumericField('Diện tích trạm (m²)')).toBe(true);
      expect(isBeaconNumericField('dien tich su dung tram den')).toBe(true);

      // 6. Số lượng nhân sự bố trí
      expect(isBeaconNumericField('staffCount')).toBe(true);
      expect(isBeaconNumericField('Số lượng nhân sự bố trí')).toBe(true);
      expect(isBeaconNumericField('Nhân sự bố trí')).toBe(true);
      expect(isBeaconNumericField('Số lượng nhân viên')).toBe(true);
      expect(isBeaconNumericField('nhan su bo tri')).toBe(true);
    });

    it('không nhận diện sai các trường phi số khác', () => {
      expect(isBeaconNumericField('name')).toBe(false);
      expect(isBeaconNumericField('Tên đèn biển')).toBe(false);
      expect(isBeaconNumericField('code')).toBe(false);
      expect(isBeaconNumericField('Mã đèn biển')).toBe(false);
      expect(isBeaconNumericField('geographicRange')).toBe(false);
      expect(isBeaconNumericField('Tầm hiệu lực địa lý')).toBe(false);
      expect(isBeaconNumericField('note')).toBe(false);
      expect(isBeaconNumericField('Ghi chú')).toBe(false);
      expect(isBeaconNumericField('coordinates')).toBe(false);
      expect(isBeaconNumericField('Tọa độ GIS')).toBe(false);
      expect(isBeaconNumericField('unitName')).toBe(false);
      expect(isBeaconNumericField('Đơn vị quản lý')).toBe(false);
      expect(isBeaconNumericField('type')).toBe(false);
      expect(isBeaconNumericField('Cấp trạm đèn')).toBe(false);
    });
  });

  describe('Định dạng 6 trường số trong Drawer Xem chi tiết', () => {
    it('chuẩn hóa định dạng hiển thị cho 6 trường khi có dữ liệu', () => {
      const mockDetailRecord = {
        towerHeight: 1250.5,
        lightHeight: 3450.75,
        lightRange: 15.25,
        area: 5000,
        stationArea: 1200.5,
        staffCount: 12,
      };

      expect(formatNumber(mockDetailRecord.towerHeight)).toBe('1.250,5');
      expect(formatNumber(mockDetailRecord.lightHeight)).toBe('3.450,75');
      expect(formatNumber(mockDetailRecord.lightRange)).toBe('15,25');
      expect(formatNumber(mockDetailRecord.area)).toBe('5.000');
      expect(formatNumber(mockDetailRecord.stationArea)).toBe('1.200,5');
      expect(formatNumber(mockDetailRecord.staffCount)).toBe('12');
    });

    it('chuẩn hóa định dạng staffCount khi >= 1000', () => {
      expect(formatNumber(1500)).toBe('1.500');
      expect(formatNumber(10000)).toBe('10.000');
    });
  });

  describe('Định dạng trong Lịch sử thay đổi', () => {
    it('định dạng đúng giá trị thay đổi dạng chuỗi hoặc số từ API history', () => {
      const testCases = [
        { field: 'towerHeight', raw: '1250.5', expected: '1.250,5' },
        { field: 'Chiều cao tháp đèn', raw: '3000', expected: '3.000' },
        { field: 'lightHeight', raw: '45.75', expected: '45,75' },
        { field: 'Chiều cao tâm sáng (m)', raw: '2000.25', expected: '2.000,25' },
        { field: 'lightRange', raw: '18.5', expected: '18,5' },
        { field: 'Tầm hiệu lực ánh sáng', raw: '1200', expected: '1.200' },
        { field: 'area', raw: '10000', expected: '10.000' },
        { field: 'Diện tích (m²)', raw: '2500.5', expected: '2.500,5' },
        { field: 'stationArea', raw: '1500.25', expected: '1.500,25' },
        { field: 'Diện tích sử dụng trạm đèn (m²)', raw: '850.5', expected: '850,5' },
        { field: 'staffCount', raw: '1500', expected: '1.500' },
        { field: 'Số lượng nhân sự bố trí', raw: '25', expected: '25' },
      ];

      for (const tc of testCases) {
        expect(isBeaconNumericField(tc.field)).toBe(true);
        expect(formatNumber(tc.raw)).toBe(tc.expected);
      }
    });
  });
});
