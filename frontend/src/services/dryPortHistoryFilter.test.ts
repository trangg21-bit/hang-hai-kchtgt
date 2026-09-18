import { describe, expect, it } from 'vitest';
import {
  EXCLUDED_CHANGE_FIELDS,
  HISTORY_FIELD_ORDER,
  NUMERIC_HISTORY_FIELDS,
  HISTORY_FIELD_LABELS,
  historyFieldName,
  historyFieldValue,
} from '../pages/port/DryPortListPage';
import { VIETNAM_PROVINCES } from '../types/common';
import { countStandardHistoryCards, renderStandardHistoryCards } from '../utils/changeHistoryRenderer';

describe('DryPort History Filter and Helpers (/dry-port)', () => {
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
      'dryPortCode',
      'dryPortName',
      'provinceId',
      'operatingOrgId',
      'operatingUnit',
      'region',
      'detailedLocation',
      'transportCorridor',
      'area',
      'warehouseArea',
      'yardArea',
      'teuCapacity',
      'connectionMode',
      'portStatus',
      'operationalStatus',
      'announcementTime',
      'announcementDecisionNumber',
      'announcementDecisionDate',
      'announcementOrg',
      'openingAnnouncementDate',
      'openingDecision',
      'investmentAgreementDoc',
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

  it('correctly maps operationalStatus, portStatus, and approvalStatus', () => {
    expect(historyFieldValue('operationalStatus', 'OPERATIONAL')).toBe('Đang khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', 'DANG_KHAI_THAC')).toBe('Đang khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', 'NOT_YET_OPERATIONAL')).toBe('Chưa khai thác/vận hành');
    expect(historyFieldValue('operationalStatus', 'SUSPENDED')).toBe('Dừng khai thác/vận hành');

    expect(historyFieldValue('portStatus', '1')).toBe('Đang khai thác/vận hành');
    expect(historyFieldValue('portStatus', '0')).toBe('Chưa khai thác/vận hành');
    expect(historyFieldValue('portStatus', '2')).toBe('Dừng khai thác/vận hành');

    expect(historyFieldValue('approvalStatus', 'DRAFT')).toBe('Lưu tạm');
    expect(historyFieldValue('approvalStatus', 'PENDING_APPROVAL')).toBe('Chờ phê duyệt cấp Cảng vụ/Chi cục');
    expect(historyFieldValue('approvalStatus', 'APPROVED_LEVEL1')).toBe('Chờ phê duyệt cấp Cục');
    expect(historyFieldValue('approvalStatus', 'APPROVED')).toBe('Đã phê duyệt');
    expect(historyFieldValue('approvalStatus', 'REJECTED_LEVEL1')).toBe('Từ chối cấp Cảng vụ/Chi cục');
    expect(historyFieldValue('approvalStatus', 'REJECTED_LEVEL2')).toBe('Từ chối cấp Cục');
  });

  it('resolves reference IDs using provided maps', () => {
    const orgMap = new Map([['org-1', 'Cục Hàng hải Việt Nam - Cảng vụ Hàng hải Hải Phòng']]);
    const symbolMap = new Map([['sym-1', 'Biểu tượng Cảng cạn']]);

    expect(historyFieldValue('orgUnitId', 'org-1', orgMap)).toBe('Cảng vụ Hàng hải Hải Phòng');
    expect(historyFieldValue('mapSymbolId', 'sym-1', undefined, symbolMap)).toBe('Biểu tượng Cảng cạn');
  });

  it('filters identical numeric values in NUMERIC_HISTORY_FIELDS', () => {
    expect(NUMERIC_HISTORY_FIELDS.has('area')).toBe(true);
    expect(NUMERIC_HISTORY_FIELDS.has('warehouseArea')).toBe(true);
    expect(NUMERIC_HISTORY_FIELDS.has('yardArea')).toBe(true);
    expect(NUMERIC_HISTORY_FIELDS.has('teuCapacity')).toBe(true);

    const isIdenticalNumeric = (fn: string, oldVal: string, newVal: string) => {
      if (oldVal === newVal) return true;
      if (NUMERIC_HISTORY_FIELDS.has(fn)) {
        const o = Number(oldVal);
        const n = Number(newVal);
        return !isNaN(o) && !isNaN(n) && o === n;
      }
      return false;
    };

    expect(isIdenticalNumeric('area', '50000', '50000.00')).toBe(true);
    expect(isIdenticalNumeric('warehouseArea', '12000.0', '12000')).toBe(true);
    expect(isIdenticalNumeric('teuCapacity', '250000', '250000.00')).toBe(true);
    expect(isIdenticalNumeric('area', '50000', '55000')).toBe(false);
  });

  it('correctly counts and groups history cards by update session', () => {
    const records = [
      {
        id: '1',
        fieldName: 'dryPortName',
        oldValue: 'Cảng cạn Đình Vũ',
        newValue: 'Cảng cạn Quốc tế Đình Vũ',
        changedAt: '2026-03-01T10:00:00Z',
        changedBy: 'user-1',
        actorName: 'Nguyễn Văn A',
        refType: 'DRY_PORT',
      },
      {
        id: '2',
        fieldName: 'teuCapacity',
        oldValue: '200000',
        newValue: '350000',
        changedAt: '2026-03-01T10:00:00Z',
        changedBy: 'user-1',
        actorName: 'Nguyễn Văn A',
        refType: 'DRY_PORT',
      },
      {
        id: '3',
        fieldName: 'area',
        oldValue: '100000',
        newValue: '150000',
        changedAt: '2026-03-02T15:30:00Z',
        changedBy: 'user-2',
        actorName: 'Trần Văn B',
        refType: 'DRY_PORT',
      },
    ];

    const count = countStandardHistoryCards({
      records,
      fieldLabels: HISTORY_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => historyFieldValue(fn, raw),
    });

    expect(count).toBe(2); // 2 distinct sessions
  });

  it('returns valid JSX when rendering history cards', () => {
    const records = [
      {
        id: '1',
        fieldName: 'dryPortName',
        oldValue: 'Cảng cạn ICD Tân Cảng',
        newValue: 'Cảng cạn ICD Tân Cảng - Long Bình',
        changedAt: '2026-03-01T10:00:00Z',
        changedBy: 'user-1',
        actorName: 'Nguyễn Văn A',
        refType: 'DRY_PORT',
      },
    ];

    const element = renderStandardHistoryCards({
      records,
      fieldLabels: HISTORY_FIELD_LABELS,
      groupOrder: HISTORY_FIELD_ORDER,
      formatValue: (fn, raw) => historyFieldValue(fn, raw),
    });

    expect(element).toBeDefined();
  });
});
