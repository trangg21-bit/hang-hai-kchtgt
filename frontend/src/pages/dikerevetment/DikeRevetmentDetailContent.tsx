import type React from 'react';
import { useState } from 'react';
import { Button, Space, Tabs } from 'antd';
import { BankOutlined, SlidersOutlined, FileTextOutlined, AuditOutlined, EnvironmentOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Symbol as MapSymbol } from '../../services/symbolService';
import type { DikeRevetmentResponse } from '../../types/dikeRevetment';
import { DIKE_REVETMENT_STATUS_LABELS } from '../../types/dikeRevetment';
import DetailTable from '../../components/shared/DetailTable';
import InfrastructureAttachmentTab from '../../components/shared/InfrastructureAttachmentTab';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import {
  actionPrimary,
  colors,
  DRAWER_TABLE_SCROLL_Y,
  fontSizeMd,
  fontWeightBold,
  spaceMd,
  outlineButtonStyle,
  statusBadgeStyle,
} from '../../themetokenchk';
import { ddToDms } from '../../utils/gisGeometry';

// Style cho thẻ phân nhóm (Section Card — mirror màn /berth: BerthDetailContent.tsx)
const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '12px 18px 8px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

// ── Props ───────────────────────────────────────────────────────────
// Chuẩn kiến trúc /berth — BerthDetailContent.tsx: component chỉ nhận
// selectedRecord + display-provider do page quản lý (map tên / helper nạp dữ
// liệu). Không phụ thuộc state Tạo/Sửa của page.

export interface OperationalStatusEntry {
  color: string;
  label: string;
}

export interface DetailContentProps {
  /** Bản ghi detail đã nạp (getById) — hiển thị các thông tin bản ghi */
  selectedRecord: DikeRevetmentResponse;
  /** operatingUnitId → tên đơn vị vận hành (page resolve tên theo OrgUnitCache) */
  operatingUnitNameById: (id?: string) => string;
  /** dikeRevetmentType value → nhãn loại kết cấu công trình */
  dikeRevetmentTypeMap: Record<string, string>;
  /** status ('1'|'2'|'3') → { color, label } cho Pill Badge 'Tình trạng' */
  operationalStatusStyleMap: Record<string, OperationalStatusEntry>;
  /** Danh sách ký hiệu bản đồ (page nạp) — decode ảnh/biểu tượng của bản ghi */
  symbols: MapSymbol[];
  /** Giải mã WKT của bản ghi → mảng điểm { lat, lng } (page truyền helper `parseWktToVertices`) */
  decodeWktToVertices: (wkt: string, geomType: string) => { lat: number; lng: number }[];
  /** Mở viewer GIS đọc-only hiển thị vị trí bản ghi (page sở hữu Modal `gisViewOpen`) */
  onOpenGis: () => void;
  /** Tải file đính kèm (page xử lý download — khớp InfrastructureAttachmentTab.onDownload) */
  onDownload: (attachmentId: string, fileName: string) => void;
}

// Pure helper format ngày — giữ nguyên hành vi module gốc DikeRevetmentList
function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try { return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss'); } catch { return dateStr; }
}

function formatDateOnly(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try { return dayjs(dateStr).format('DD/MM/YYYY'); } catch { return dateStr; }
}

function formatYear(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try { return dayjs(dateStr).format('YYYY'); } catch { return dateStr; }
}

function parseVerticesLike(wkt: string, geomType: string, decode: DetailContentProps['decodeWktToVertices']) {
  try {
    return decode(wkt, geomType || '');
  } catch {
    return [];
  }
}

/**
 * Nội dung "Xem chi tiết" đê chắn sóng / đê chắn cát / kè hướng dòng / kè bảo vệ bờ.
 * ZIG tách từ khối inline DikeRevetmentList (L1808–2113), giữ nguyên 5 tab:
 * Thông tin cơ bản | Thông tin vị trí | File đính kèm | Vận hành & bảo trì | Xử lý & theo dõi.
 */
export default function DikeRevetmentDetailContent(props: DetailContentProps) {
  const {
    selectedRecord: detailRecord,
    operatingUnitNameById,
    dikeRevetmentTypeMap,
    operationalStatusStyleMap,
    symbols,
    decodeWktToVertices,
    onOpenGis,
    onDownload,
  } = props;

  // DetailRow + renderDetailRows + renderSectionHeader (chuẩn /vts-operation-center)
  type DetailRow = { label: string; value: React.ReactNode; fullWidth?: boolean };

  const renderDetailRows = (rows: DetailRow[], paddingTop = spaceMd) => (
    <div className="chk-detail-grid" style={{ paddingTop }}>
      {rows.map((row) => {
        // Trường fullWidth === true → chiếm trọn 2 cột. Các trường thường chiếm 1 cột và wrap khi nội dung dài
        const isLong = row.fullWidth === true;
        return (
          <div key={row.label} className={isLong ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
            <span className="chk-detail-label">{row.label}</span>
            <span className="chk-detail-value" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal' }}>{row.value}</span>
          </div>
        );
      })}
    </div>
  );

  const detailBasicRows: DetailRow[] = detailRecord ? [
    { label: 'Mã đê kè', value: detailRecord.code ?? null },
    { label: 'Tên đê kè', value: <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{detailRecord.dikeRevetmentName ?? null}</span> },
    { label: 'Đơn vị quản lý', value: detailRecord.orgUnitName || detailRecord.orgUnitId || null },
    { label: 'Thuộc cảng biển', value: detailRecord.seaportName || detailRecord.seaportId || null },
    { label: 'Đơn vị vận hành', value: operatingUnitNameById(detailRecord.operatingUnitId) },
    { label: 'Địa điểm (Tỉnh/TP)', value: detailRecord.location ?? null },
    { label: 'Địa điểm chi tiết', value: detailRecord.locationDetail ?? null },
    { label: 'Loại kết cấu công trình', value: detailRecord.dikeRevetmentType ? (dikeRevetmentTypeMap[detailRecord.dikeRevetmentType] || detailRecord.dikeRevetmentType) : null },
    {
      label: 'Tình trạng',
      value: detailRecord.status
        ? (() => {
            const st = operationalStatusStyleMap[detailRecord.status];
            return st ? <span style={statusBadgeStyle(st.color)}>{st.label}</span> : detailRecord.status;
          })()
        : null,
    },
    { label: 'Ghi chú', value: detailRecord.note ?? null },
  ] : [];

  const detailTechRows: DetailRow[] = detailRecord ? [
    { label: 'Chiều dài (m)', value: detailRecord.length != null ? String(detailRecord.length) : null },
    { label: 'Chiều cao (m)', value: detailRecord.height != null ? String(detailRecord.height) : null },
    { label: 'Cao trình đỉnh (m)', value: detailRecord.crestElevation != null ? String(detailRecord.crestElevation) : null },
  ] : [];

  const detailTimeRows: DetailRow[] = detailRecord ? [
    { label: 'Thời điểm xây dựng', value: formatDateOnly(detailRecord.constructionDate) },
    { label: 'Thời điểm đưa vào khai thác', value: formatYear(detailRecord.commissioningDate) },
    { label: 'Năm bảo trì gần nhất', value: detailRecord.lastMaintenanceYear ?? null },
  ] : [];

  const detailOperationRows: { key: string; code: string; name: string; startDate: string; endDate: string }[] = detailRecord
    ? (detailRecord.operationPlanCode || detailRecord.operationPlanName || detailRecord.operationStartDate || detailRecord.operationEndDate)
      ? [{
          key: 'operation',
          code: detailRecord.operationPlanCode ?? '—',
          name: detailRecord.operationPlanName ?? '—',
          startDate: detailRecord.operationStartDate ?? '—',
          endDate: detailRecord.operationEndDate ?? '—',
        }]
      : []
    : [];

  const detailMaintenanceRows: { key: string; code: string; name: string; startDate: string; endDate: string }[] = detailRecord
    ? (detailRecord.maintenancePlanCode || detailRecord.maintenancePlanName || detailRecord.maintenanceStartDate || detailRecord.maintenanceEndDate)
      ? [{
          key: 'maintenance',
          code: detailRecord.maintenancePlanCode ?? '—',
          name: detailRecord.maintenancePlanName ?? '—',
          startDate: detailRecord.maintenanceStartDate ?? '—',
          endDate: detailRecord.maintenanceEndDate ?? '—',
        }]
      : []
    : [];

  const detailIncidentRows: { key: string; code: string; name: string; type: string; location: string; time: string }[] = detailRecord
    ? (detailRecord.incidentCode || detailRecord.incidentType || detailRecord.incidentLocation || detailRecord.incidentTime)
      ? [{
          key: 'incident',
          code: detailRecord.incidentCode ?? '—',
          name: detailRecord.incidentName ?? '—',
          type: detailRecord.incidentType ?? '—',
          location: detailRecord.incidentLocation ?? '—',
          time: detailRecord.incidentTime ?? '—',
        }]
      : []
    : [];

  // Khung cuộn chuẩn CHK từng tab-pane Xem chi tiết (paddingTop 3 + overflowY auto + maxHeight calc(100vh - 290px))
  const detailPaneScrollStyle: React.CSSProperties = {
    paddingTop: 3,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 290px)',
  };

  // ── Biểu tượng bản đồ của bản ghi ───────────────────────────────
  const renderMapSymbol = () => {
    const symId = detailRecord.symbolId;
    const sym = symbols.find((s) => s.id === symId || (symId && String(s.id) === String(symId)));
    if (sym) {
      const imgSrc = sym.image
        ? (sym.image.startsWith('data:') || sym.image.startsWith('http') || sym.image.startsWith('/')
            ? sym.image
            : `data:image/png;base64,${sym.image}`)
        : undefined;
      return (
        <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {imgSrc
            ? <img src={imgSrc} alt={sym.name || ''} style={{ width: 20, height: 20, objectFit: 'contain', verticalAlign: 'middle', display: 'inline-block' }} />
            : <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />}
          <span>{sym.code ? `${sym.name} (${sym.code})` : sym.name}</span>
        </Space>
      );
    }
    return (
      <Space size={8} align="center" style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: actionPrimary }} />
        <span>{symId ? `Biểu tượng (${symId})` : '—'}</span>
      </Space>
    );
  };

  const coordinateRows = detailRecord.coordinates
    ? parseVerticesLike(detailRecord.coordinates, detailRecord.geometryType || '', decodeWktToVertices).map((p, i) => ({ key: i, latitude: p.lat, longitude: p.lng }))
    : [];

  // ── Các tab bản ghi (giữ nguyên thứ tự nhóm nguyên bản) ─────────
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [operationOpen, setOperationOpen] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(true);
  const [incidentOpen, setIncidentOpen] = useState(true);

  // 3 Section Card accordion dọc cho tab 'Vận hành & bảo trì' (chuẩn /berth /beacon-stations)
  const renderOperationSectionCard = (opts: {
    title: string;
    icon: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div style={{ ...sectionBoxStyle, padding: opts.open ? '12px 18px 12px 18px' : '10px 18px' }}>
      <button
        type="button"
        aria-expanded={opts.open}
        onClick={opts.onToggle}
        style={{
          ...sectionHeaderStyle,
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          padding: 0,
          paddingBottom: opts.open ? 8 : 0,
          marginBottom: opts.open ? 12 : 0,
          background: 'none',
          border: 'none',
          borderBottom: opts.open ? '1px solid #f1f5f9' : 'none',
        }}
      >
        <div style={{ ...sectionTitleStyle, fontSize: 14 }}>
          {opts.icon}
          <span>{opts.title}</span>
        </div>
        <span style={{ color: actionPrimary, fontSize: 12 }}>
          {opts.open ? <DownOutlined /> : <RightOutlined />}
        </span>
      </button>
      {opts.open ? <div>{opts.children}</div> : null}
    </div>
  );

  const detailTabItems: Array<{ key: string; label: string; children: React.ReactNode }> = detailRecord
    ? [
        {
          key: 'basic',
          label: 'Thông tin chung',
          children: (
            <div style={detailPaneScrollStyle}>
              {/* ── Card 1: Thông tin cơ bản & Quản lý vận hành ── */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <BankOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin cơ bản & Quản lý vận hành</span>
                  </div>
                </div>
                {renderDetailRows(detailBasicRows)}
              </div>
              {/* ── Card 2: Thông tin kỹ thuật ── */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <SlidersOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin kỹ thuật</span>
                  </div>
                </div>
                {renderDetailRows(detailTechRows)}
              </div>
              {/* ── Card 3: Thông tin thời gian ── */}
              <div style={sectionBoxStyle}>
                <div style={sectionHeaderStyle}>
                  <div style={sectionTitleStyle}>
                    <FileTextOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin thời gian</span>
                  </div>
                </div>
                {renderDetailRows(detailTimeRows)}
              </div>
              {/* ── Card 4: Thông tin phê duyệt (mở/đóng) ── */}
              <div style={{ ...sectionBoxStyle, padding: approvalOpen ? '12px 18px 8px 18px' : '10px 18px' }}>
                <button
                  type="button"
                  aria-expanded={approvalOpen}
                  onClick={() => setApprovalOpen(!approvalOpen)}
                  style={{
                    ...sectionHeaderStyle,
                    cursor: 'pointer',
                    width: '100%',
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                  }}
                >
                  <div style={sectionTitleStyle}>
                    <AuditOutlined style={{ color: actionPrimary }} />
                    <span>Thông tin phê duyệt</span>
                  </div>
                  {approvalOpen ? (
                    <DownOutlined style={{ color: colors.sidebarBg, fontSize: 12 }} />
                  ) : (
                    <RightOutlined style={{ color: colors.sidebarBg, fontSize: 12 }} />
                  )}
                </button>
                {approvalOpen && (
                  <div className="chk-detail-grid" style={{ paddingTop: 6 }}>
                    {[
                      { key: 'updatedAt', label: 'Ngày cập nhật', fullWidth: false, value: detailRecord.updatedAt ? formatDate(detailRecord.updatedAt) : null },
                      { key: 'updatedBy', label: 'Cán bộ cập nhật', fullWidth: false, value: detailRecord.updatedByName || detailRecord.updatedBy || null },
                      { key: 'submittedAt', label: 'Ngày gửi phê duyệt', fullWidth: false, value: detailRecord.submittedAt ? formatDate(detailRecord.submittedAt) : null },
                      { key: 'submittedBy', label: 'Cán bộ gửi phê duyệt', fullWidth: false, value: detailRecord.submittedByName || null },
                      { key: 'approvedDateLevel1', label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục', fullWidth: false, value: detailRecord.approvedDateLevel1 ? formatDate(detailRecord.approvedDateLevel1) : null },
                      { key: 'approvalContentLevel1', label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục', fullWidth: true, value: detailRecord.approvalContentLevel1 || null },
                      { key: 'approvedByLevel1', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', fullWidth: false, value: detailRecord.approvedByNameLevel1 || detailRecord.approverLevel1 || null },
                      { key: 'approvedDateLevel2', label: 'Ngày phê duyệt cấp Cục', fullWidth: false, value: detailRecord.approvedDateLevel2 ? formatDate(detailRecord.approvedDateLevel2) : null },
                      { key: 'approvalContentLevel2', label: 'Nội dung phê duyệt cấp Cục', fullWidth: true, value: detailRecord.approvalContentLevel2 || null },
                      { key: 'approvedByLevel2', label: 'Cán bộ phê duyệt cấp Cục', fullWidth: false, value: detailRecord.approvedByNameLevel2 || detailRecord.approverLevel2 || null },
                      { key: 'rejectionReason', label: 'Lý do từ chối', fullWidth: true, value: detailRecord.rejectionReason || null },
                      { key: 'approvalStatus', label: 'Trạng thái', fullWidth: true, value: <ApprovalStatusBadge status={detailRecord.approvalStatus} labelOverrides={DIKE_REVETMENT_STATUS_LABELS} /> },
                    ].map((row: { key: string; label: string; value: React.ReactNode; fullWidth?: boolean }) => (
                      <div key={row.key} className={row.fullWidth ? 'chk-detail-row chk-detail-row--full' : 'chk-detail-row'}>
                        <span className="chk-detail-label">{row.label}</span>
                        <span className="chk-detail-value">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        },
        {
          key: 'gis',
          label: `Thông tin vị trí (${coordinateRows.length})`,
          children: (
            <div style={{ paddingTop: 6, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
              <div style={sectionBoxStyle}>
                <div className="chk-detail-grid">
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col1-label">Loại đối tượng</span>
                    <span className="chk-detail-value">{[detailRecord.geometryType].includes('LINE') ? 'Đối tượng đường' : [detailRecord.geometryType].includes('POLYGON') ? 'Đối tượng vùng' : detailRecord.geometryType === 'POINT' ? 'Đối tượng điểm' : ''}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Biểu tượng</span>
                    <span className="chk-detail-value">{renderMapSymbol()}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col1-label">Hệ quy chiếu</span>
                    <span className="chk-detail-value">{(() => { const cs = detailRecord.coordinateSystem; if (cs === 1 || cs === '1') return 'WGS-84'; if (cs === 2 || cs === '2') return 'VN-2000'; return cs ? String(cs) : ''; })()}</span>
                  </div>
                  <div className="chk-detail-row">
                    <span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span>
                    <span className="chk-detail-value">{detailRecord.geometryType || detailRecord.coordinates ? 'Độ, phút, giây (DMS)' : ''}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32, marginBottom: 12 }}>
                <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 13.5, lineHeight: '32px' }}>Tọa độ GPS ({coordinateRows.length})</span>
                <Button icon={<EnvironmentOutlined style={{ color: actionPrimary }} />} onClick={onOpenGis}
                  style={{ ...outlineButtonStyle, height: 32, fontSize: 13.5, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Xem vị trí trên bản đồ
                </Button>
              </div>
              <DetailTable
                dataSource={coordinateRows}
                emptyText="Chưa có tọa độ GPS nào"
                scrollY={DRAWER_TABLE_SCROLL_Y.detailGis}
                columns={[
                  { title: 'STT', width: 50, align: 'center' as const, render: (_value: unknown, _record: unknown, rowIndex: number) => rowIndex + 1 },
                  { title: 'Vĩ độ (Latitude - N)', key: 'lat', render: (_value: unknown, record: any) => { const dms = ddToDms(record.latitude); return `${dms.d}° ${dms.m}' ${dms.s}" N`; } },
                  { title: 'Kinh độ (Longitude - E)', key: 'lng', render: (_value: unknown, record: any) => { const dms = ddToDms(record.longitude); return `${dms.d}° ${dms.m}' ${dms.s}" E`; } },
                ]}
              />
            </div>
          ),
        },
        {
          key: 'files',
          label: 'File đính kèm',
          children: (
            <InfrastructureAttachmentTab
              attachments={(detailRecord.attachments || []).map((a) => ({
                id: a.id,
                fileName: a.fileName,
                filePath: a.filePath || a.fileUrl,
                fileSize: a.fileSize,
                uploadedBy: a.uploadedBy,
                uploadedByName: a.uploadedBy,
                uploadedDate: a.uploadedDate || a.uploadDate,
              }))}
              readonly
              onDownload={onDownload}
            />
          ),
        },
        {
          key: 'operation',
          label: 'Vận hành & bảo trì',
          children: (
            <div style={{ paddingTop: 6, paddingRight: 0, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(100vh - 190px)', minHeight: 350 }}>
              {renderOperationSectionCard({
                title: 'Thông tin vận hành khai thác',
                icon: <SlidersOutlined style={{ color: actionPrimary }} />,
                open: operationOpen,
                onToggle: () => setOperationOpen((v) => !v),
                children: (
                  <DetailTable
                    dataSource={detailOperationRows}
                    emptyText="Chưa có dữ liệu"
                    rowKey="key"
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50, render: (_v: unknown, _r: unknown, i: number) => i + 1 },
                      { title: 'Mã kế hoạch', dataIndex: 'code', key: 'code' },
                      { title: 'Tên kế hoạch', dataIndex: 'name', key: 'name' },
                      { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate' },
                      { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate' },
                    ]}
                  />
                ),
              })}
              {renderOperationSectionCard({
                title: 'Thông tin bảo trì',
                icon: <SlidersOutlined style={{ color: actionPrimary }} />,
                open: maintenanceOpen,
                onToggle: () => setMaintenanceOpen((v) => !v),
                children: (
                  <DetailTable
                    dataSource={detailMaintenanceRows}
                    emptyText="Chưa có dữ liệu"
                    rowKey="key"
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50, render: (_v: unknown, _r: unknown, i: number) => i + 1 },
                      { title: 'Mã kế hoạch', dataIndex: 'code', key: 'code' },
                      { title: 'Tên kế hoạch', dataIndex: 'name', key: 'name' },
                      { title: 'Ngày bắt đầu', dataIndex: 'startDate', key: 'startDate' },
                      { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate' },
                    ]}
                  />
                ),
              })}
              {renderOperationSectionCard({
                title: 'Thông tin sự cố',
                icon: <SlidersOutlined style={{ color: actionPrimary }} />,
                open: incidentOpen,
                onToggle: () => setIncidentOpen((v) => !v),
                children: (
                  <DetailTable
                    dataSource={detailIncidentRows}
                    emptyText="Chưa có dữ liệu"
                    rowKey="key"
                    scrollY={160}
                    columns={[
                      { title: 'STT', width: 50, render: (_v: unknown, _r: unknown, i: number) => i + 1 },
                      { title: 'Mã sự cố', dataIndex: 'code', key: 'code' },
                      { title: 'Tên sự cố', dataIndex: 'name', key: 'name' },
                      { title: 'Loại sự cố', dataIndex: 'type', key: 'type' },
                      { title: 'Địa điểm', dataIndex: 'location', key: 'location' },
                      { title: 'Thời gian', dataIndex: 'time', key: 'time' },
                    ]}
                  />
                ),
              })}
            </div>
          ),
        },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Chia divider nhạt như màn /berth (mirror BerthDetailContent scoped CSS) */}
      <style>{`
        .dike-revetment-drawer-scope .chk-detail-grid .chk-detail-row,
        .dike-revetment-drawer-scope .chk-detail-grid .chk-detail-row--full {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .dike-revetment-drawer-scope .chk-detail-grid .chk-detail-row:last-child,
        .dike-revetment-drawer-scope .chk-detail-grid .chk-detail-row--full:last-child {
          border-bottom: none !important;
        }
      `}</style>
      <Tabs
        defaultActiveKey="basic"
        tabBarStyle={{ marginBottom: 0 }}
        className="chk-detail-tabs"
        items={detailTabItems}
      />
    </div>
  );
}
