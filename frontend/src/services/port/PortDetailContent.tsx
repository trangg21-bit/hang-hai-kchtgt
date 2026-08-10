import React from 'react';
import { Descriptions, Table, Tag, InputNumber, Space, Tabs } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeSm, fontSizeMd, fontWeightMedium, fontWeightBold,
  spaceSm, spaceMd, spaceXs,
  surfaceCard, surfacePage,
} from '../../tokens';

export interface PortDetailContentProps {
  selectedRecord: any;
  orgUnits: Array<{ id: string; name: string }>;
  symbols: Array<{ id: string; name: string; code?: string; image?: string }>;
  detailFiles: any[];
  trangThaiPheDuyetBadge: (status: string) => { label: string; color: string };
  ddToDms: (dd: number) => { d: number; m: number; s: number };
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

export default function PortDetailContent({
  selectedRecord,
  orgUnits,
  symbols,
  detailFiles,
  trangThaiPheDuyetBadge,
  ddToDms,
}: PortDetailContentProps) {
  return (
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 16 }}>
              <style>{`.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.detail-row{display:flex;padding:10px 12px;border-bottom:1px solid ${borderDefault}}.detail-label{width:200px;flex-shrink:0;color:${colors.sidebarBg};font-weight:${fontWeightBold};font-size:${fontSizeMd}px}.detail-label::after{content:':';margin-left:2px}.detail-value{color:${textPrimary};font-size:${fontSizeMd}px;flex:1}`}</style>
              <div className="detail-grid">
                {[
                  ['Đơn vị quản lý', selectedRecord.orgUnitId ? (orgUnits.find((o) => o.id === selectedRecord.orgUnitId)?.name || '—') : '—'],
                  ['Nhóm cảng biển', selectedRecord.portGroup ? 'Nhóm ' + selectedRecord.portGroup : '—'],
                  ['Mã cảng biển', selectedRecord.portCode],
                  ['Tên cảng biển', selectedRecord.portName],
                  ['Địa điểm (Tỉnh/Thành phố)', selectedRecord.province || '—'],
                  ['Địa điểm chi tiết', selectedRecord.detailedLocation || '—'],
                  ['Phân cấp cảng biển', selectedRecord.portClass != null ? (selectedRecord.portClass === 5 ? 'Cấp đặc biệt' : `Cấp ${selectedRecord.portClass}`) : '—'],
                  ['Trạng thái phê duyệt', selectedRecord.approvalStatus ? <Tag color={trangThaiPheDuyetBadge(selectedRecord.approvalStatus).color}>{trangThaiPheDuyetBadge(selectedRecord.approvalStatus).label}</Tag> : '—'],
                  ['Phạm vi vùng nước cảng biển', selectedRecord.waterAreaScope || '—'],
                  ['Tổng số bến cảng', selectedRecord.totalBerths ?? '—'],
                  ['Tổng số khu neo đậu, khu chuyển tải', selectedRecord.totalAnchoragesTransshipment ?? '—'],
                  ['Tổng số tuyến luồng hàng hải công cộng', selectedRecord.totalPublicChannels ?? '—'],
                  ['Tổng số tuyến luồng hàng hải chuyên dùng', selectedRecord.totalDedicatedChannels ?? '—'],
                  ['Tổng chiều dài luồng HH công cộng (km)', selectedRecord.totalPublicChannelLength != null ? selectedRecord.totalPublicChannelLength.toFixed(2) : '—'],
                  ['Tổng chiều dài luồng HH chuyên dùng (km)', selectedRecord.totalDedicatedChannelLength != null ? selectedRecord.totalDedicatedChannelLength.toFixed(2) : '—'],
                  ['Tổng số phao tiêu, báo hiệu hàng hải', selectedRecord.totalBuoysBeacons ?? '—'],
                  ['Tổng số đê, kè', selectedRecord.totalDikes ?? '—'],
                  ['Tổng chiều dài hệ thống đê, kè (km)', selectedRecord.totalDikeLength != null ? selectedRecord.totalDikeLength.toFixed(2) : '—'],
                  ['Tổng số đèn biển, đăng, tiêu độc lập', selectedRecord.totalLighthouses ?? '—'],
                  ['Số lượng bến phao', selectedRecord.buoyBerthCount ?? '—'],
                  ['Số lượng khu neo đậu', selectedRecord.anchorageCount ?? '—'],
                  ['Số lượng khu chuyển tải', selectedRecord.transshipmentCount ?? '—'],
                  ['Các khu nước, vùng nước khác', selectedRecord.otherWaterAreas || '—'],
                  ['Ghi chú', selectedRecord.remarks || '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          key: 'gis', label: 'Thông tin vị trí',
          children: (
            <div style={{ paddingTop: 16 }}>
              <div className="detail-grid">
                {[
                  ['Loại đối tượng', selectedRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : selectedRecord.geometryType === 'LINE' ? 'Đối tượng đường' : selectedRecord.geometryType === 'POLYGON' ? 'Đối tượng vùng' : '—'],
                  ['Biểu tượng bản đồ', selectedRecord.mapSymbolId ? (symbols.find((s) => s.id === selectedRecord.mapSymbolId)?.name || selectedRecord.mapSymbolId) : '—'],
                  ['Hệ quy chiếu', selectedRecord.coordinateSystem === 1 ? 'WGS-84' : selectedRecord.coordinateSystem === 2 ? 'VN-2000' : '—'],
                  ['Quy tắc hiển thị', 'Độ, phút, giây (DMS)'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
              {/* GPS Coordinates table */}
              <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                <span style={detailLabelStyle}>Tọa độ GPS</span>
                {(() => {
                  const wkt = (selectedRecord as any).coordinates || '';
                  const arr = (selectedRecord as any).coordinateList;
                  const pts: Array<{ lat: number; lng: number }> = [];
                  if (arr && Array.isArray(arr) && arr.length > 0) {
                    pts.push(...arr.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
                  } else if (wkt) {
                    const mm = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
                    if (mm) {
                      mm[1].split('),(').forEach((pt: string) => {
                        const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                        pts.push({ lat: Number(parts[1]), lng: Number(parts[0]) });
                      });
                    } else {
                      const m = wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                      if (m) pts.push({ lat: Number(m[2]), lng: Number(m[1]) });
                    }
                  } else if (selectedRecord.latitude != null && selectedRecord.longitude != null) {
                    pts.push({ lat: selectedRecord.latitude, lng: selectedRecord.longitude });
                  }
                  return (
                    <Table className="list-view-table" dataSource={pts.map((p, i) => ({ ...p, key: i }))} pagination={false} size="middle" bordered style={{ marginTop: spaceXs }}>
                      <Table.Column title="STT" key="stt" width={60} align="center"
                        render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{i + 1}</span>}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Vĩ độ (N)" key="lat"
                        render={(_: any, record: any) => {
                          const dms = ddToDms(record.lat);
                          return <Space.Compact size="small"><InputNumber value={dms.d} readOnly style={{ width: 50 }} /><span style={{ padding: '0 4px', color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ width: 50 }} /><span style={{ padding: '0 4px', color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ width: 60 }} /><span style={{ padding: '0 4px', color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                      <Table.Column title="Kinh độ (E)" key="lng"
                        render={(_: any, record: any) => {
                          const dms = ddToDms(record.lng);
                          return <Space.Compact size="small"><InputNumber value={dms.d} readOnly style={{ width: 50 }} /><span style={{ padding: '0 4px', color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ width: 50 }} /><span style={{ padding: '0 4px', color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ width: 60 }} /><span style={{ padding: '0 4px', color: textTertiary }}>"</span></Space.Compact>;
                        }}
                        onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                    </Table>
                  );
                })()}
              </div>
            </div>
          ),
        },
        {
          key: 'infra', label: 'Công trình KCHT',
          children: (
            <div style={{ paddingTop: 16 }}>
              <div style={{ marginBottom: spaceSm, padding: '0 12px' }}>
                <span style={detailLabelStyle}>Công trình KCHT</span>
              </div>
                <Table className="list-view-table" dataSource={((selectedRecord as any).infrastructureList || []).map((i: any, idx: number) => ({ ...i, key: idx }))} pagination={false} size="middle" bordered>
                  <Table.Column title="STT" dataIndex="stt" key="stt" width={60} align="center"
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên Công Trình" dataIndex="infraName" key="name"
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Số Lượng" dataIndex="quantity" key="qty" width={100} align="center"
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </Table>
            </div>
          ),
        },
        {
          key: 'files', label: 'File đính kèm',
          children: (
            <div style={{ paddingTop: 16 }}>
              <div style={{ marginBottom: spaceSm, padding: '0 12px' }}>
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
                <Table className="list-view-table" dataSource={detailFiles.map((f, i) => ({ ...f, key: f.id, _idx: i }))} pagination={false} size="middle" bordered>
                  <Table.Column title="STT" key="stt" width={60} align="center"
                    render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên file" key="name" dataIndex="fileName"
                    render={(name: string) => <span style={{ fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </Table>
            </div>
          ),
        },
        {
          key: 'system', label: 'Hệ thống',
          children: (
            <div style={{ paddingTop: 16 }}>
              <div className="detail-grid">
                {[
                  ['Người tạo', selectedRecord.createdByName || selectedRecord.createdBy || '—'],
                  ['Ngày tạo', selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString('vi-VN') : '—'],
                  ['Cập nhật bởi', selectedRecord.updatedByName || selectedRecord.updatedBy || '—'],
                  ['Ngày cập nhật', selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleString('vi-VN') : '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}

