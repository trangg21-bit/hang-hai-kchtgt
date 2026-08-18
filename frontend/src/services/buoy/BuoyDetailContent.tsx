// ── BuoyDetailContent — presentational detail body (T5, design §2.6) ─
// 5 Tabs (PortDetailContent pattern): general / technical / approval / audit / files.
// org/user name mapping comes from the page (orgUnits / userMap props) — no FE fetch.

import React from 'react';
import { Table, Tabs } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../theme';
import {
  textPrimary, textSecondary, textTertiary, borderDefault,
  fontSizeMd, fontWeightBold, fontWeightMedium,
  spaceSm,
} from '../../tokens';
import {
  BUOY_TYPE_OPTIONS,
  COLOR_LABEL_MAP,
  SHAPE_LABEL_MAP,
  LIGHT_CHAR_LABEL_MAP,
} from './schema';
import type { Buoy } from './types';

export interface BuoyDetailContentProps {
  selectedRecord: Buoy;
  orgUnits: Array<{ id: string; name: string }>;
  userMap: Map<string, string>;
  detailFiles: any[];
  buoyStatusBadge: (status: string) => { color: string; label: string };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  } catch {
    return dateStr;
  }
}

function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return dayjs(dateStr).format('DD/MM/YYYY');
  } catch {
    return dateStr;
  }
}

const detailLabelStyle: React.CSSProperties = { color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd };

export default function BuoyDetailContent({
  selectedRecord,
  orgUnits,
  userMap,
  detailFiles,
  buoyStatusBadge,
}: BuoyDetailContentProps) {
  const r = selectedRecord;
  const orgName = (id: string | undefined) =>
    id ? (orgUnits.find((o) => o.id === id)?.name || id) : '—';
  const userName = (id: number | string | undefined | null) =>
    id != null ? (userMap.get(String(id)) || String(id)) : '—';
  const statusBadge = (() => {
    const b = buoyStatusBadge(r.status || '');
    return (
      <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${b.color}15`, color: b.color }}>
        {b.label}
      </span>
    );
  })();

  const detailGrid = (
    <style>{`.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}.detail-row{display:flex;padding:10px 12px;border-bottom:1px solid ${borderDefault}}.detail-label{width:200px;flex-shrink:0;color:${colors.sidebarBg};font-weight:${fontWeightBold};font-size:${fontSizeMd}px}.detail-label::after{content:':';margin-left:2px}.detail-value{color:${textPrimary};font-size:${fontSizeMd}px;flex:1;overflow-wrap:anywhere}.detail-value .ant-tag{margin-left:-6px!important}`}</style>
  );

  const gridRows = (rows: Array<[string, React.ReactNode]>) => (
    <div className="detail-grid">
      {rows.map(([label, value]) => (
        <div key={String(label)} className="detail-row">
          <span className="detail-label">{label}</span>
          <span className="detail-value">{value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Tabs defaultActiveKey="general" tabBarStyle={{ marginBottom: 0, paddingTop: 0 }}
      items={[
        {
          key: 'general', label: 'Thông tin chung',
          children: (
            <div style={{ paddingTop: 3 }}>
              {detailGrid}
              {gridRows([
                ['Mã phao tiêu', r.code],
                ['Tên phao tiêu', r.name],
                ['Loại phao', BUOY_TYPE_OPTIONS.find((o) => o.value === r.type)?.label || r.type || '—'],
                ['Đơn vị quản lý', orgName(r.unitId)],
                ['Trạng thái hoạt động', r.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'],
                ['Trạng thái', statusBadge],
                ['Mô tả', r.description || '—'],
              ])}
            </div>
          ),
        },
        {
          key: 'technical', label: 'Kỹ thuật',
          children: (
            <div style={{ paddingTop: 3 }}>
              {detailGrid}
              {gridRows([
                ['Kinh độ', r.longitude != null ? r.longitude.toFixed(6) : '—'],
                ['Vĩ độ', r.latitude != null ? r.latitude.toFixed(6) : '—'],
                ['Phạm vi quan sát', r.range != null ? `${r.range} hải lý` : '—'],
                ['Màu sắc', r.color ? (COLOR_LABEL_MAP[r.color] || r.color) : '—'],
                ['Hình dạng', r.shape ? (SHAPE_LABEL_MAP[r.shape] || r.shape) : '—'],
                ['Đặc tính ánh sáng', r.lightCharacteristic ? (LIGHT_CHAR_LABEL_MAP[r.lightCharacteristic] || r.lightCharacteristic) : '—'],
                ['Kiểm tra gần nhất', formatDateOnly(r.lastInspectionDate)],
                ['Kiểm tra kế tiếp', formatDateOnly(r.nextInspectionDate)],
              ])}
            </div>
          ),
        },
        {
          key: 'approval', label: 'Phê duyệt',
          children: (
            <div style={{ paddingTop: 3 }}>
              {detailGrid}
              {gridRows([
                ['Trạng thái', statusBadge],
                ['Cấp phê duyệt', r.approvalLevel != null ? `Cấp ${r.approvalLevel}` : '—'],
                ['Người phê duyệt L1', userName(r.level1ApprovedBy)],
                ['Ngày phê duyệt L1', formatDate(r.level1ApprovedDate)],
                ['Người phê duyệt L2', userName(r.level2ApprovedBy)],
                ['Ngày phê duyệt L2', formatDate(r.level2ApprovedDate)],
                ['Lý do từ chối', r.rejectionReason || '—'],
              ])}
            </div>
          ),
        },
        {
          key: 'audit', label: 'Kiểm toán',
          children: (
            <div style={{ paddingTop: 3 }}>
              {detailGrid}
              {gridRows([
                ['Người tạo', userName(r.createdBy)],
                ['Ngày tạo', formatDate(r.createdAt)],
                ['Người cập nhật', userName(r.updatedBy)],
                ['Ngày cập nhật', formatDate(r.updatedAt)],
              ])}
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
              {detailFiles.length === 0 ? (
                <span style={{ color: textTertiary, fontSize: fontSizeMd, paddingLeft: 12 }}>Không có tài liệu đính kèm</span>
              ) : (
                <Table className="list-view-table" dataSource={detailFiles.map((f, i) => ({ ...f, key: f.id, _idx: i }))} pagination={false} size="middle" bordered style={{ marginLeft: 12, marginRight: 12 }}>
                  <Table.Column title="STT" key="stt" width={60} align="center"
                    render={(_: any, __: any, i: number) => <span style={{ fontSize: fontSizeMd, color: textSecondary, fontWeight: fontWeightMedium }}>{i + 1}</span>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                  <Table.Column title="Tên file" key="name" dataIndex="fileName" align="center"
                    render={(name: string) => <div style={{ textAlign: 'left', fontSize: fontSizeMd, color: textPrimary }}><FileOutlined style={{ marginRight: spaceSm, color: textTertiary }} />{name}</div>}
                    onHeaderCell={() => ({ style: { background: colors.bodyBg, color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd, textTransform: 'uppercase' as const, padding: '12px 12px' } })} />
                </Table>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
