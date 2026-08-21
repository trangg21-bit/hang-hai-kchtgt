import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Tabs, Table, Space, InputNumber } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import { colors } from '../../theme';
import { resolveOrgFullPath } from '../../components/org-unit';
import {
  textPrimary, textSecondary, textTertiary, borderDefault, surfaceCard,
  fontSizeSm, fontSizeMd, fontSizeLg, fontWeightMedium, fontWeightBold,
  spaceSm, spaceXs,
} from '../../tokens';
import type { Pier } from '../../types/port';

export interface PierDetailContentProps {
  selectedRecord: Pier;
  orgMap: Map<string, string>;
  portMap: Map<string, string>;
  berthOptions: Array<{ value: string; label: string }>;
  symbolMap: Map<string, string>;
  symbolImageMap: Map<string, string>;
  detailFiles: any[];
  ddToDms: (dd: number) => { d: number; m: number; s: number };
  approvalStyleMap: Record<string, { color: string; label: string }>;
  operationalStyleMap: Record<string, { color: string; label: string }>;
  userMap: Map<string, string>;
  waterwayMap?: Map<string, string>;
  berthDetail?: { berthCode?: string; berthName?: string } | null;
  organizations: Array<{ id: string; name: string; code?: string; parentId?: string }>;
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

function formatDateOnly(d: string | null | undefined): string {
  if (!d) return '—';
  try { return dayjs(d).format('DD/MM/YYYY'); } catch { return d; }
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  try { return dayjs(d).format('DD/MM/YYYY HH:mm:ss'); } catch { return d; }
}


export default function PierDetailContent({
  selectedRecord, orgMap, portMap, berthOptions, symbolMap, symbolImageMap,
  detailFiles, ddToDms, approvalStyleMap, operationalStyleMap,
  userMap, waterwayMap, berthDetail, organizations,
}: PierDetailContentProps) {
  const r = selectedRecord;
  const [systemOpen, setSystemOpen] = useState(true);

  const berthLabel = berthOptions.find(o => o.value === r.berthId)?.label || r.berthName || r.berthId || '—';
  const portLabel = r.portId ? (portMap.get(r.portId) || r.portId) : '—';

  const coords: Array<{ lat: number; lng: number }> = [];
  if (r.coordinates) {
    try {
      const wkt = r.coordinates;
      const mm = wkt.match(/MULTIPOINT\s*\(([^)]+(?:\),[^)]+)*)\)/);
      if (mm) {
        mm[1].split('),(').forEach((pt: string) => {
          const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
          coords.push({ lng: Number(parts[0]), lat: Number(parts[1]) });
        });
      } else {
        const pt = wkt.match(/POINT\s*\(([\-\d.]+)\s+([\-\d.]+)\)/);
        if (pt) coords.push({ lng: Number(pt[1]), lat: Number(pt[2]) });
      }
    } catch { /* ignore */ }
  }

  return (
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0, position: 'sticky', top: 0, zIndex: 1, background: surfaceCard }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              <style>{`.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.detail-row{display:flex;padding:10px 12px;border-bottom:1px solid ${borderDefault}}.detail-label{width:200px;flex-shrink:0;color:${colors.sidebarBg};font-weight:${fontWeightBold};font-size:${fontSizeMd}px}.detail-label::after{content:':';margin-left:2px}.detail-value{color:${textPrimary};font-size:${fontSizeMd}px;flex:1}.ant-tabs-nav{margin-bottom:0!important;padding-left:12px!important}`}</style>
              <div className="detail-grid">
                {[
                  ['Đơn vị quản lý', (() => {
                    const orgPathNames = resolveOrgFullPath(organizations, r.orgUnitId);
                    if (!orgPathNames || orgPathNames.length === 0) return orgMap.get(r.orgUnitId || '') || r.orgUnitId || '—';
                    const levelColors = [textPrimary, textSecondary, textTertiary];
                    return (
                      <span style={{ fontWeight: fontWeightBold }}>
                        {orgPathNames.map((n, i) => (
                          <span key={i} style={{ display: 'block', color: levelColors[Math.min(i, levelColors.length - 1)] }}>{n}</span>
                        ))}
                      </span>
                    );
                  })(),],
                  ['Thuộc cảng biển', <span style={{ fontWeight: fontWeightBold }}>{portLabel}</span>],
                  ['Thuộc bến cảng', berthLabel],
                  ['Mã bến cảng', berthDetail?.berthCode || '—'],
                  ['Tên bến cảng', berthDetail?.berthName || berthLabel],
                  ['Thuộc luồng hàng hải', waterwayMap?.get(r.navigationChannelId || '') || r.navigationChannelId || '—'],
                  ['Mã cầu cảng', <span key="pierCode" style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: '#1677ff15', color: '#1677ff' }}>{r.pierCode || '—'}</span>],
                  ['Tên cầu cảng', <span style={{ fontWeight: fontWeightBold }}>{r.pierName || '—'}</span>],
                  ['Địa điểm (Tỉnh/Thành phố)', r.province || '—'],
                  ['Địa điểm chi tiết', r.detailedLocation || '—'],
                  ['Chiều dài (m)', r.length != null ? r.length : '—'],
                  ['Chiều rộng (m)', r.width != null ? r.width : '—'],
                  ['Phân cấp công trình', r.constructionGrade != null ? (r.constructionGrade === 1 ? 'Cấp đặc biệt' : r.constructionGrade === 2 ? 'Cấp 1' : r.constructionGrade === 3 ? 'Cấp 2' : r.constructionGrade === 4 ? 'Cấp 3' : r.constructionGrade === 5 ? 'Cấp 4' : String(r.constructionGrade)) : '—'],
                  ['Loại kết cấu cầu cảng', r.structureType != null ? (r.structureType === 1 ? 'Kết cấu bệ cọc cao' : r.structureType === 2 ? 'Kết cấu cường từ' : r.structureType === 3 ? 'Kết cấu trọng lực' : r.structureType === 4 ? 'Kết cấu khác' : String(r.structureType)) : '—'],
                  ['Công năng khai thác', r.operationalFunction || '—'],
                  ['Tình trạng', (() => { const s = r.operationalStatus; const b = s && operationalStyleMap[s]; return b ? <span style={{ display:'inline-flex',padding:'2px 10px',borderRadius:999,fontSize:fontSizeMd,fontWeight:fontWeightMedium,background:`${b.color}15`,color:b.color }}>{b.label}</span> : '—'; })(),],
                  ['Trạng thái', (() => { const s = r.approvalStatus; const b = s && approvalStyleMap[s]; return b ? <span style={{ display:'inline-flex',padding:'2px 10px',borderRadius:999,fontSize:fontSizeMd,fontWeight:fontWeightMedium,background:`${b.color}15`,color:b.color }}>{b.label}</span> : '—'; })(),],
                  ['Độ sâu khu nước hiện tại (theo TBHH gần nhất) (m)', r.currentWaterDepth || '—'],
                  ['Cao độ đáy bến thiết kế', r.designBedElevation || '—'],
                  ['Cỡ tàu khai thác theo công bố (DWT)', r.publishedVesselDWT || '—'],
                  ['Số lượng cầu cảng đang khai thác', r.operatingPierCount != null ? r.operatingPierCount : '—'],
                  ['Số lượng cầu cảng đã công bố', r.publishedPierCount != null ? r.publishedPierCount : '—'],
                  ['Số lượng cầu cảng đang được thỏa thuận đầu tư xây dựng', r.investmentAgreementPierCount != null ? r.investmentAgreementPierCount : '—'],
                  ['Sản lượng hàng thông qua', r.cargoThroughput != null ? `${r.cargoThroughput} tấn` : '—'],
                  ['Tiếp nhận tàu có trọng tải lớn hơn thông số tại quyết định công bố', r.receivesLargeVessel ? 'Có' : 'Không'],
                  ['Thời điểm phê duyệt quy trình bảo trì công trình', r.maintenanceApprovalDate || '—'],
                  ['Thời điểm được chấp thuận hồ sơ báo cáo đánh giá ATCT (gần nhất)', r.safetyAssessmentDate || '—'],
                  ['Thời điểm kiểm định gần nhất', r.lastInspectionDate || '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ cursor: 'pointer', marginTop: 10, paddingLeft: 12 }} onClick={() => setSystemOpen(!systemOpen)}>
                <span style={{ color: systemOpen ? '#1677ff' : colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>{systemOpen ? '▼' : '▶'} Thông tin hệ thống</span>
              </div>
              {systemOpen && (
                <div className="detail-grid" style={{ marginTop: 4 }}>
                  {[
                    ['Người tạo', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.createdBy || '') || r.createdBy || '—'}</span>],
                    ['Ngày tạo', fmtDateTime(r.createdAt)],
                    ['Cán bộ cập nhật', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.updatedBy || '') || r.updatedBy || '—'}</span>],
                    ['Ngày cập nhật', fmtDateTime(r.updatedAt)],
                    ['Cán bộ gửi phê duyệt', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.submittedForApprovalBy || '') || r.submittedForApprovalBy || '—'}</span>],
                    ['Ngày gửi phê duyệt', fmtDateTime(r.submittedForApprovalAt)],
                    ['Cán bộ phê duyệt cấp Cảng vụ/Chi cục', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.portAuthorityApprovedBy || '') || r.portAuthorityApprovedBy || '—'}</span>],
                    ['Ngày phê duyệt cấp Cảng vụ/Chi cục', fmtDateTime(r.portAuthorityApprovedAt)],
                    ['Cán bộ phê duyệt cấp Cục', <span style={{ fontWeight: fontWeightBold }}>{userMap.get(r.departmentApprovedBy || '') || r.departmentApprovedBy || '—'}</span>],
                    ['Ngày phê duyệt cấp Cục', fmtDateTime(r.departmentApprovedAt)],
                    ['Nội dung phê duyệt cấp Cảng vụ/Chi cục', (r as any).portAuthorityApprovalContent || '—'],
                    ['Nội dung phê duyệt cấp Cục', (r as any).departmentApprovalContent || '—'],
                  ].map(([label, value], i) => (
                    <div key={i} className="detail-row">
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
        {
          key: 'announcement', label: 'Thông tin phương án, công bố & phạm vi khu nước',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div className="detail-grid">
                {[
                  ['Số văn bản', r.documentNumber || '—'],
                  ['Ngày văn bản', formatDateOnly(r.documentDate)],
                  ['Thời điểm công bố mở, đưa vào sử dụng', formatDateOnly(r.openingAnnouncementDate)],
                  ['Quyết định công bố/ Văn bản cho phép khai thác', r.openingDecision || '—'],
                  ['Văn bản thỏa thuận đầu tư xây dựng', r.investmentAgreementDoc || '—'],
                  ['Phạm vi khu nước neo buộc tàu', r.waterAreaNeutralScope || '—'],
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
            <div style={{ paddingTop: 3 }}>
              <div className="detail-grid">
                {[
                  ['Loại đối tượng', { POINT: 'Đối tượng điểm', LINE: 'Đối tượng đường', POLYGON: 'Đối tượng vùng' }[(r as any).geometryType || ''] || (r as any).geometryType || '—'],
                  ['Biểu tượng', (() => { const symId = r.mapSymbolId || r.bieuTuongId || ''; const symName = symbolMap.get(symId) || symId || '—'; const symImg = symbolImageMap.get(symId); return <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{symImg ? <img src={symImg} alt="" style={{ width:24,height:24,objectFit:'contain' }} /> : null}{symName}</span>; })(),],
                  ['Hệ quy chiếu', (r as any).coordinateSystem === 1 ? 'WGS-84' : (r as any).coordinateSystem === 2 ? 'VN-2000' : '—'],
                  ['Quy tắc hiển thị', ((r as any).geometryType || (r as any).coordinates || (r as any).latitude != null || (r as any).longitude != null) ? 'Độ, phút, giây (DMS)' : '—'],
                ].map(([label, value], i) => (
                  <div key={i} className="detail-row">
                    <span className="detail-label">{label}</span>
                    <span className="detail-value">{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: spaceSm, padding: '0 12px' }}>
                <span style={detailLabelStyle}>Tọa độ GPS</span>
                {coords.length === 0 ? (
                  <div style={{ color: textTertiary, fontSize: fontSizeMd, marginTop: spaceXs }}>Không có tọa độ</div>
                ) : (
                  <Table className="list-view-table" dataSource={coords.map((p, i) => ({ ...p, key: i }))} pagination={false} size="middle" bordered style={{ marginTop: spaceXs }}>
                    <Table.Column title="STT" key="stt" width={60} align="center"
                      render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary }}>{i + 1}</span>}
                      onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                    <Table.Column title="Vĩ độ (N)" key="lat" align="center"
                      render={(_: any, rec: any) => {
                        const dms = ddToDms(rec.lat);
                        return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ flex: 1.2, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                      }}
                      onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                    <Table.Column title="Kinh độ (E)" key="lng" align="center"
                      render={(_: any, rec: any) => {
                        const dms = ddToDms(rec.lng);
                        return <Space.Compact size="small" style={{ width: '100%', display: 'flex' }}><InputNumber value={dms.d} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>°</span><InputNumber value={dms.m} readOnly style={{ flex: 1, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, borderRight: 0, fontSize: fontSizeSm, color: textTertiary }}>'</span><InputNumber value={dms.s} readOnly style={{ flex: 1.2, textAlign: 'center' }} /><span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 6px', background: '#f5f5f5', border: `1px solid ${borderDefault}`, borderLeft: 0, fontSize: fontSizeSm, color: textTertiary }}>"</span></Space.Compact>;
                      }}
                      onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  </Table>
                )}
              </div>
            </div>
          ),
        },
        {
          key: 'files', label: 'File đính kèm',
          children: (
            <div style={{ paddingTop: 3 }}>
              <div style={{ marginBottom: spaceSm, padding: '10px 12px 0 12px' }}>
                <span style={detailLabelStyle}>File đính kèm</span>
              </div>
              <Table className="list-view-table" rowKey="key" dataSource={detailFiles.map((f, i) => ({ ...f, key: f.id, _idx: i }))} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}
                locale={{ emptyText: (
                  <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, color: textTertiary, marginBottom: 12 }}><FileOutlined /></div>
                    <span style={{ color: textTertiary, fontSize: fontSizeLg }}>Không có tài liệu đính kèm</span>
                  </div>
                ) }}
              >
                <Table.Column title="STT" key="stt" width={60} align="center"
                  render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                <Table.Column title="Tên file" key="name" dataIndex="fileName" align="center"
                  render={(name: string) => <div style={{ textAlign: 'left', fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</div>}
                  onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
              </Table>
            </div>
          ),
        },
      ]}
    />
  );
}
