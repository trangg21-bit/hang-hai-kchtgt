import { describe, expect, it } from 'vitest';
import {
  historyFieldName,
  historyFieldValue,
} from './vtsassist/VtsAssistListPage';

describe('Ánh xạ trường và giá trị lịch sử Phụ trợ VTS (VtsAssist)', () => {
  it('ánh xạ tên trường sang tiếng Việt chính xác', () => {
    expect(historyFieldName('deviceCode')).toBe('Mã thiết bị');
    expect(historyFieldName('deviceName')).toBe('Tên thiết bị');
    expect(historyFieldName('manufacturer')).toBe('Hãng sản xuất');
    expect(historyFieldName('model')).toBe('Model');
    expect(historyFieldName('quantity')).toBe('Số lượng');
    expect(historyFieldName('orgUnitId')).toBe('Đơn vị quản lý');
    expect(historyFieldName('operatingUnitId')).toBe('Đơn vị khai thác');
    expect(historyFieldName('attachedInfrastructureType')).toBe('Loại hạ tầng');
    expect(historyFieldName('attachedInfrastructureId')).toBe('Thuộc hạ tầng');
    expect(historyFieldName('unitOfMeasure')).toBe('Đơn vị tính');
    expect(historyFieldName('operationalStatus')).toBe('Trạng thái hoạt động');
    expect(historyFieldName('approvalStatus')).toBe('Trạng thái phê duyệt');
    expect(historyFieldName('objectType')).toBe('Loại đối tượng');
    expect(historyFieldName('coordinateSystem')).toBe('Hệ quy chiếu');
  });

  it('dịch mã rỗng hoặc null sang (trống)', () => {
    expect(historyFieldValue('deviceCode', null)).toBe('(trống)');
    expect(historyFieldValue('deviceCode', '')).toBe('(trống)');
    expect(historyFieldValue('deviceCode', '(null)')).toBe('(trống)');
  });

  it('dịch đơn vị quản lý và đơn vị khai thác qua map', () => {
    const orgMap = new Map<string, string>([
      ['org-1', 'Cục Hàng hải - Cảng vụ Hàng hải Hải Phòng'],
    ]);
    const opMap = new Map<string, string>([
      ['op-1', 'Công ty Bảo đảm An toàn Hàng hải'],
    ]);

    expect(historyFieldValue('orgUnitId', 'org-1', orgMap)).toBe('Cảng vụ Hàng hải Hải Phòng');
    expect(historyFieldValue('operatingUnitId', 'op-1', orgMap, undefined, undefined, undefined, opMap)).toBe('Công ty Bảo đảm An toàn Hàng hải');
  });

  it('dịch loại hạ tầng và thuộc hạ tầng VTS/Radar', () => {
    const vtsMap = new Map<string, string>([['vts-1', 'TTDH VTS Hải Phòng']]);
    const radarMap = new Map<string, string>([['rad-1', 'Trạm Radar Hòn Dáu']]);

    expect(historyFieldValue('attachedInfrastructureType', '1')).toBe('TTDH VTS');
    expect(historyFieldValue('attachedInfrastructureType', '2')).toBe('Trạm Radar');
    expect(historyFieldValue('attachedInfrastructureId', 'vts-1', undefined, undefined, vtsMap, radarMap)).toBe('TTDH VTS Hải Phòng');
    expect(historyFieldValue('attachedInfrastructureId', 'rad-1', undefined, undefined, vtsMap, radarMap)).toBe('Trạm Radar Hòn Dáu');
  });

  it('dịch loại đối tượng và hệ quy chiếu', () => {
    expect(historyFieldValue('objectType', 'POINT')).toBe('Đối tượng điểm');
    expect(historyFieldValue('objectType', 'LINE')).toBe('Đối tượng đường');
    expect(historyFieldValue('objectType', 'POLYGON')).toBe('Đối tượng vùng');
    expect(historyFieldValue('coordinateSystem', '1')).toBe('WGS-84');
    expect(historyFieldValue('coordinateSystem', '2')).toBe('VN-2000');
  });

  it('dịch trạng thái vận hành và phê duyệt chuẩn', () => {
    expect(historyFieldValue('operationalStatus', '1')).toBe('Đang khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', 'OPERATIONAL')).toBe('Đang khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', '0')).toBe('Chưa khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', '2')).toBe('Dừng khai thác/vận hành');

    expect(historyFieldValue('approvalStatus', 'DRAFT')).toBe('Lưu tạm');
    expect(historyFieldValue('approvalStatus', 'PENDING_APPROVAL')).toBe('Chờ Cảng vụ duyệt');
    expect(historyFieldValue('approvalStatus', 'APPROVED_LEVEL1')).toBe('Chờ Cục duyệt');
    expect(historyFieldValue('approvalStatus', 'APPROVED')).toBe('Đã duyệt');
    expect(historyFieldValue('approvalStatus', 'REJECTED_LEVEL1')).toBe('Bị Cảng vụ trả về');
    expect(historyFieldValue('approvalStatus', 'REJECTED_LEVEL2')).toBe('Bị Cục trả về');
  });
});

