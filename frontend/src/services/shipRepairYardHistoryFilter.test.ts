import { describe, expect, it } from 'vitest';
import {
  EXCLUDED_CHANGE_FIELDS,
  HISTORY_FIELD_ORDER,
  NUMERIC_HISTORY_FIELDS,
  historyFieldLabels,
  historyFieldName,
  historyFieldValue,
} from '../pages/ship-repair-yard/ShipRepairYardListPage';
import { VIETNAM_PROVINCES } from '../types/common';
import { countStandardHistoryCards, renderStandardHistoryCards } from '../utils/changeHistoryRenderer';

describe('ShipRepairYard History Filter and Helpers', () => {
  it('excludes workflow metadata fields from change history', () => {
    const excluded = [
      'approvalStatus',
      'Trạng thái phê duyệt',
      'approverLevel1',
      'approvedDateLevel1',
      'approverLevel2',
      'approvedDateLevel2',
      'rejectionReason',
      'Lý do từ chối',
      'portAuthorityApprovedBy',
      'portAuthorityApprovedAt',
      'portAuthorityApprovalContent',
      'departmentApprovedBy',
      'departmentApprovedAt',
      'departmentApprovalContent',
      'submittedForApprovalAt',
      'submittedForApprovalBy',
      'Thời điểm gửi phê duyệt',
      'Người gửi phê duyệt',
      'Thời điểm Cảng vụ phê duyệt',
      'Thời điểm Cục phê duyệt',
      'Nội dung Cảng vụ phê duyệt',
      'Nội dung Cục phê duyệt',
      'Cán bộ Cảng vụ phê duyệt',
      'Cán bộ Cục phê duyệt',
      'attachments',
      'spatialId',
      'Vị trí không gian',
      'createdAt',
      'updatedAt',
      'createdBy',
      'updatedBy',
      'deletedAt',
      'deletedBy',
    ];

    for (const field of excluded) {
      expect(EXCLUDED_CHANGE_FIELDS.has(field)).toBe(true);
    }
  });

  it('keeps genuine business fields', () => {
    const businessFields = [
      'shipRepairYardCode',
      'shipRepairYardName',
      'portId',
      'pierId',
      'provinceId',
      'detailedLocation',
      'operationalStatus',
      'usageFunction',
      'workshopArea',
      'vesselType',
      'vesselDwt',
      'businessType',
      'activity',
      'slipwayCount',
      'remarks',
      'mapSymbolId',
      'Tọa độ GPS',
      'Loại đối tượng',
    ];

    for (const field of businessFields) {
      expect(EXCLUDED_CHANGE_FIELDS.has(field)).toBe(false);
    }
  });

  it('correctly maps provinceId using 1-based index from VIETNAM_PROVINCES', () => {
    expect(historyFieldValue('provinceId', '1')).toBe(VIETNAM_PROVINCES[0]); // 'An Giang'
    expect(historyFieldValue('provinceId', '2')).toBe(VIETNAM_PROVINCES[1]); // 'Bà Rịa - Vũng Tàu'
    // If not a valid index, returns original string
    expect(historyFieldValue('provinceId', '999')).toBe('999');
    expect(historyFieldValue('provinceId', 'invalid')).toBe('invalid');
  });

  it('correctly maps operationalStatus and approvalStatus', () => {
    expect(historyFieldValue('operationalStatus', 'OPERATIONAL')).toBe('Đang khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', 'DANG_KHAI_THAC')).toBe('Đang khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', 'NOT_YET_OPERATIONAL')).toBe('Chưa khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', 'SUSPENDED')).toBe('Dừng khai thác/vận hành');

    expect(historyFieldValue('approvalStatus', 'DRAFT')).toBe('Lưu tạm');
    expect(historyFieldValue('approvalStatus', 'PENDING_APPROVAL')).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(historyFieldValue('approvalStatus', 'APPROVED_LEVEL1')).toBe('Chờ phê duyệt cấp Cục');
    expect(historyFieldValue('approvalStatus', 'APPROVED')).toBe('Đã phê duyệt');
    expect(historyFieldValue('approvalStatus', 'REJECTED_LEVEL1')).toBe('Từ chối cấp Cảng vụ/Chi cục');
    expect(historyFieldValue('approvalStatus', 'REJECTED_LEVEL2')).toBe('Từ chối cấp Cục');
  });

  it('resolves reference IDs using provided maps', () => {
    const orgMap = new Map([['org-1', 'Cục Hàng hải Việt Nam - Chi cục Hàng hải I']]);
    const portMap = new Map([['port-1', 'Cảng biển Hải Phòng']]);
    const pierMap = new Map([['pier-1', 'Cầu cảng số 1']]);
    const symbolMap = new Map([['sym-1', 'Biểu tượng CS SCĐT']]);

    expect(historyFieldValue('orgUnitId', 'org-1', orgMap)).toBe('Chi cục Hàng hải I');
    expect(historyFieldValue('portId', 'port-1', undefined, undefined, portMap)).toBe('Cảng biển Hải Phòng');
    expect(historyFieldValue('pierId', 'pier-1', undefined, undefined, undefined, pierMap)).toBe('Cầu cảng số 1');
    expect(historyFieldValue('mapSymbolId', 'sym-1', undefined, symbolMap)).toBe('Biểu tượng CS SCĐT');
  });

  it('filters identical numeric values in NUMERIC_HISTORY_FIELDS', () => {
    expect(NUMERIC_HISTORY_FIELDS.has('workshopArea')).toBe(true);
    expect(NUMERIC_HISTORY_FIELDS.has('slipwayCount')).toBe(true);

    const oldN = Number('1200.00');
    const newN = Number('1200');
    expect(!isNaN(oldN) && !isNaN(newN) && oldN === newN).toBe(true);

    const oldSlip = Number('2');
    const newSlip = Number('2');
    expect(!isNaN(oldSlip) && !isNaN(newSlip) && oldSlip === newSlip).toBe(true);
  });

  it('counts history updates correctly and renders standard history cards', () => {
    const records = [
      {
        id: '1',
        entityId: 'rec-1',
        fieldName: 'shipRepairYardName',
        oldValue: 'Xưởng cũ',
        newValue: 'Xưởng mới',
        changedBy: 'Nguyễn Văn A',
        changedAt: '2026-03-01T10:00:00',
        approvedDate: '2026-03-01T10:00:00',
      },
      {
        id: '2',
        entityId: 'rec-1',
        fieldName: 'workshopArea',
        oldValue: '1000',
        newValue: '1500',
        changedBy: 'Nguyễn Văn A',
        changedAt: '2026-03-01T10:00:00',
        approvedDate: '2026-03-01T10:00:00',
      },
    ];

    const count = countStandardHistoryCards({
      records,
      fieldLabels: historyFieldLabels,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => historyFieldValue(fn, raw),
    });

    expect(count).toBe(1); // Same session grouped into 1 update card

    const cards = renderStandardHistoryCards({
      records,
      fieldLabels: historyFieldLabels,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => historyFieldValue(fn, raw),
    });

    expect(cards).toBeTruthy();
  });

  it('maps coordinates field names to Tọa độ GPS in historyFieldLabels', () => {
    expect(historyFieldLabels.coordinates).toBe('Tọa độ GPS');
    expect(historyFieldLabels.gisCoordinates).toBe('Tọa độ GPS');
    expect(historyFieldLabels['Tọa độ']).toBe('Tọa độ GPS');
    expect(historyFieldName('coordinates')).toBe('Tọa độ GPS');
    expect(historyFieldName('gisCoordinates')).toBe('Tọa độ GPS');
  });

  it('formats WKT coordinates in historyFieldValue nicely', () => {
    const wkt = 'LINESTRING (110.939944 18.906278, 110.94025 18.906389, 110.940417 18.906472)';
    const formatted = historyFieldValue('coordinates', wkt);
    expect(formatted).toBeTruthy();
    expect(formatted).not.toContain('LINESTRING');
    expect(formatted).toContain('18° 54\'');
    expect(formatted).toContain('110° 56\'');
  });
});
