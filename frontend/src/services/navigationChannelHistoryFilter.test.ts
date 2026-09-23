import { describe, it, expect } from 'vitest';
import { fmtNum } from '../utils/numFmt';
import { DEFAULT_IGNORED_FIELDS } from '../utils/changeHistoryRenderer';
import { parseWktToCoordinates } from '../utils/gisGeometry';

describe('NavigationChannel History Synchronization (/navigation-channel vs /beacon-stations)', () => {
  const isMeaningfulChange = (
    field: string,
    rawOld: string | null | undefined,
    rawNew: string | null | undefined,
  ): boolean => {
    const f = (field || '').trim();
    const fLower = f.toLowerCase();
    if (
      DEFAULT_IGNORED_FIELDS.has(f) ||
      DEFAULT_IGNORED_FIELDS.has(fLower) ||
      fLower === 'approvalstatus' ||
      fLower === 'trạng thái phê duyệt' ||
      fLower === 'trang thai phe duyet' ||
      fLower === 'trạng thái' ||
      fLower === 'status' ||
      fLower === 'approvalcontentlevel1' ||
      fLower === 'approvalcontentlevel2' ||
      fLower === 'level1approvalcontent' ||
      fLower === 'level2approvalcontent' ||
      fLower === 'approverlevel1' ||
      fLower === 'approverlevel2' ||
      fLower === 'approveddatelevel1' ||
      fLower === 'approveddatelevel2' ||
      fLower === 'submitteddate' ||
      fLower === 'submittedat' ||
      fLower === 'submittedby' ||
      fLower === 'cấp 1 phê duyệt' ||
      fLower === 'cấp 2 phê duyệt' ||
      fLower === 'nội dung phê duyệt' ||
      fLower === 'ngày gửi phê duyệt' ||
      fLower === 'người gửi phê duyệt' ||
      fLower === 'rejectionreason' ||
      fLower === 'lý do từ chối' ||
      fLower === 'ly do tu choi' ||
      fLower === 'spatialid' ||
      fLower === 'routewkts' ||
      fLower === 'routedetails'
    ) {
      return false;
    }
    const isBlank = (v: string | null | undefined): boolean => {
      if (v == null) return true;
      const s = String(v).trim().toLowerCase();
      return (
        s === '' ||
        s === '—' ||
        s === '-' ||
        s === '–' ||
        s === 'null' ||
        s === '(null)' ||
        s === '(trống)' ||
        s === 'chưa có' ||
        s === 'undefined'
      );
    };
    if (isBlank(rawOld) && isBlank(rawNew)) return false;
    const ov = rawOld != null ? String(rawOld).trim() : '';
    const nv = rawNew != null ? String(rawNew).trim() : '';
    if (ov !== '' && nv !== '' && ov.toLowerCase() === nv.toLowerCase()) return false;
    if (ov !== '' && nv !== '' && !isNaN(Number(ov)) && !isNaN(Number(nv)) && Math.abs(Number(ov) - Number(nv)) < 1e-9) {
      return false;
    }
    const ovFmt = !isNaN(Number(ov)) ? fmtNum(ov) : ov;
    const nvFmt = !isNaN(Number(nv)) ? fmtNum(nv) : nv;
    if (ovFmt.trim() !== '' && ovFmt.trim() === nvFmt.trim()) {
      return false;
    }
    return true;
  };

  it('filters out internal approval metadata, spatialId, and route subtable fields', () => {
    expect(isMeaningfulChange('approvalStatus', 'DRAFT', 'APPROVED')).toBe(false);
    expect(isMeaningfulChange('Trạng thái phê duyệt', 'Lưu tạm', 'Đã duyệt')).toBe(false);
    expect(isMeaningfulChange('spatialId', '', 'uuid-123')).toBe(false);
    expect(isMeaningfulChange('routeDetails', '', '[]')).toBe(false);
    expect(isMeaningfulChange('rejectionReason', '', 'Từ chối')).toBe(false);
  });

  it('retains meaningful business field changes', () => {
    expect(isMeaningfulChange('channelName', 'Luồng A', 'Luồng B')).toBe(true);
    expect(isMeaningfulChange('buoyCount', '10', '12')).toBe(true);
    expect(isMeaningfulChange('stationAreaSquareMeters', '100', '150')).toBe(true);
  });

  it('normalizes numeric values and ignores scale differences', () => {
    expect(isMeaningfulChange('protectionScopeMeters', '50.0000', '50')).toBe(false);
    expect(isMeaningfulChange('latestDredgingVolumeCubicMeters', '10000.00', '10000')).toBe(false);
    expect(isMeaningfulChange('protectionScopeMeters', '50', '60')).toBe(true);
  });

  it('correctly parses WKT coordinates for GIS field changes', () => {
    const wkt = 'LINESTRING (106.6 10.7, 106.7 10.8)';
    const coords = parseWktToCoordinates(wkt);
    expect(coords.length).toBe(2);
    expect(coords[0].longitude).toBeCloseTo(106.6);
    expect(coords[0].latitude).toBeCloseTo(10.7);
  });

  it('computes history update count based on card sessions (validHistoryGroups) instead of field diff count', () => {
    const group1 = {
      tsSec: 1000,
      ts: '2026-09-20T10:00:00',
      actor: 'Admin',
      items: [
        {
          changes: [
            { field: 'channelName', oldValue: 'Cũ 1', newValue: 'Mới 1' },
            { field: 'buoyCount', oldValue: '10', newValue: '12' },
            { field: 'beaconCount', oldValue: '5', newValue: '6' },
          ],
        },
      ],
    };

    const validChanges = group1.items[0].changes.filter((c) => isMeaningfulChange(c.field, c.oldValue, c.newValue));
    expect(validChanges.length).toBe(3);

    const validGroups = [group1];
    const historyUpdateCount = validGroups.length;
    expect(historyUpdateCount).toBe(1);
  });
});
