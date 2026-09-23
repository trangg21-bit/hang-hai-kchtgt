import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NavigationChannelDetailContent from './NavigationChannelDetailContent';
import type { NavigationChannelResponse } from '../../types/navigationChannel';

describe('NavigationChannelDetailContent UI synchronization with /beacon-stations', () => {
  const mockRecord: NavigationChannelResponse = {
    id: 'ch-001',
    channelCode: 'LHH-000007',
    channelName: 'Hải Thịnh',
    orgUnitId: 'org-cuc-01',
    operatingUnitId: 'org-dn-02',
    seaportId: 'port-01',
    conditionStatus: 'OPERATIONAL',
    approvalStatus: 'APPROVED',
    protectionScopeMeters: 500,
    latestDredgingVolumeCubicMeters: 167396,
    latestMaintenanceYear: 2024,
    latestStationRepairMonth: '2023-05',
    stationCount: 1,
    stationStaffCount: 5,
    buoyCount: 21,
    beaconCount: 2,
    managementStation: 'Trạm QLBHHH Hải Thịnh',
    detailedLocation: 'Thôn Hải Thịnh, Nam Định',
    announcementDecisionNumber: '1066/QĐ-CHHVN',
    announcementDecisionDate: '2012-11-30',
    announcementDecisionIssuer: 'Cục Hàng hải Việt Nam',
    submittedAt: '2024-01-10T08:00:00Z',
    submittedBy: 'user-01',
    level1ApprovedAt: '2024-01-11T09:00:00Z',
    level1ApprovedBy: 'user-02',
    level1ApprovalContent: 'Đồng ý cấp Chi cục',
    level2ApprovedAt: '2024-01-12T10:00:00Z',
    level2ApprovedBy: 'user-03',
    level2ApprovalContent: 'Đồng ý cấp Cục',
    coordinates: [],
    attachments: [],
    routeDetails: [],
  };

  const orgMap = new Map<string, string>([
    ['org-cuc-01', 'Cục Hàng hải và Đường thủy Việt Nam'],
    ['org-dn-02', 'Công ty Bảo đảm an toàn hàng hải'],
  ]);

  const userMap = new Map<string, string>([
    ['user-01', 'Nguyễn Văn A'],
    ['user-02', 'Trần Thị B'],
    ['user-03', 'Lê Văn C'],
  ]);

  it('renders all 4 sections in Tab Thông tin chung matching /beacon-stations pattern', () => {
    const html = renderToStaticMarkup(
      <NavigationChannelDetailContent
        record={mockRecord}
        orgMap={orgMap}
        userMap={userMap}
      />
    );

    expect(html).toContain('Thông tin cơ bản &amp; Quản lý vận hành');
    expect(html).toContain('Thông số kỹ thuật &amp; Năng lực khai thác');
    expect(html).toContain('Thông tin công bố mở, đưa vào sử dụng');
    expect(html).toContain('Thông tin phê duyệt');
  });

  it('resolves orgUnitId and operatingUnitId to Vietnamese names using orgMap, eliminating raw UUIDs', () => {
    const html = renderToStaticMarkup(
      <NavigationChannelDetailContent
        record={mockRecord}
        orgMap={orgMap}
        userMap={userMap}
      />
    );

    expect(html).toContain('Cục Hàng hải và Đường thủy Việt Nam');
    expect(html).toContain('Công ty Bảo đảm an toàn hàng hải');
    // Raw IDs should not appear
    expect(html).not.toContain('org-cuc-01');
    expect(html).not.toContain('org-dn-02');
  });

  it('displays maintenance year as clean integer 2024, not 2.024', () => {
    const html = renderToStaticMarkup(
      <NavigationChannelDetailContent
        record={mockRecord}
        orgMap={orgMap}
        userMap={userMap}
      />
    );

    expect(html).toContain('2024');
    expect(html).not.toContain('2.024');
  });

  it('resolves approver user IDs to Vietnamese names using userMap in Thông tin phê duyệt', () => {
    const html = renderToStaticMarkup(
      <NavigationChannelDetailContent
        record={mockRecord}
        orgMap={orgMap}
        userMap={userMap}
      />
    );

    expect(html).toContain('Nguyễn Văn A');
    expect(html).toContain('Trần Thị B');
    expect(html).toContain('Lê Văn C');
    expect(html).toContain('Đồng ý cấp Chi cục');
    expect(html).toContain('Đồng ý cấp Cục');
  });

  it('reads approver/date fields by BE names (approverLevel1/approvedDateLevel1) — khối Thông tin phê duyệt không được trống', () => {
    const beRecord: NavigationChannelResponse = {
      ...mockRecord,
      level1ApprovedBy: undefined,
      level1ApprovedAt: undefined,
      level2ApprovedBy: undefined,
      level2ApprovedAt: undefined,
      approverLevel1: 'user-02',
      approvedDateLevel1: '2024-01-11T09:00:00Z',
      approverLevel2: 'user-03',
      approvedDateLevel2: '2024-01-12T10:00:00Z',
    };

    const html = renderToStaticMarkup(
      <NavigationChannelDetailContent record={beRecord} orgMap={orgMap} userMap={userMap} />
    );

    expect(html).toContain('Trần Thị B');
    expect(html).toContain('Lê Văn C');
    expect(html).toContain('11/01/2024');
    expect(html).toContain('12/01/2024');
    // Đã có tên cán bộ thì không được lộ id thô
    expect(html).not.toContain('user-02');
    expect(html).not.toContain('user-03');
  });

  it('hiển thị trống khi đơn vị vận hành không còn tồn tại trong danh mục (không lộ UUID thô)', () => {
    const staleUnitRecord: NavigationChannelResponse = {
      ...mockRecord,
      operatingUnitId: 'org-deleted-99',
    };

    const html = renderToStaticMarkup(
      <NavigationChannelDetailContent record={staleUnitRecord} orgMap={orgMap} userMap={userMap} />
    );

    expect(html).toContain('Đơn vị vận hành');
    expect(html).not.toContain('org-deleted-99');
  });

  it('renders GPS coordinates count and DMS points from coordinateList or WKT string', () => {
    const recordWithCoords: NavigationChannelResponse = {
      ...mockRecord,
      coordinates: 'LINESTRING (106.123456 20.123456, 106.234567 20.234567)' as any,
      coordinateList: [
        { id: 'c1', sequenceNo: 1, longitude: 106.123456, latitude: 20.123456 },
        { id: 'c2', sequenceNo: 2, longitude: 106.234567, latitude: 20.234567 },
      ] as any,
    };

    const html = renderToStaticMarkup(
      <NavigationChannelDetailContent record={recordWithCoords} />
    );

    expect(html).toContain('Thông tin vị trí (2)');
    expect(html).toContain('Tọa độ GPS (2)');
    expect(html).toContain('24.44');
    expect(html).toContain('Vĩ độ (Latitude - N)');
    expect(html).toContain('Kinh độ (Longitude - E)');
  });

  it('resolves mapIconId UUID to symbol name and does not display raw UUID', () => {
    const recordWithSymbol: NavigationChannelResponse = {
      ...mockRecord,
      mapIconId: 'a1b2c3d4-e5f6-7a8b-9c0d-112233445523',
    };

    const mockSymbols = [
      { id: 'a1b2c3d4-e5f6-7a8b-9c0d-112233445523', code: 'CHANNEL', name: 'Luồng hàng hải', image: '' },
    ];

    const html = renderToStaticMarkup(
      <NavigationChannelDetailContent record={recordWithSymbol} symbols={mockSymbols} />
    );

    expect(html).toContain('Luồng hàng hải');
    expect(html).not.toContain('a1b2c3d4-e5f6-7a8b-9c0d-112233445523');
  });
});
