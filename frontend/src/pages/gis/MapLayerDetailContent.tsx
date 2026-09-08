import React from 'react';
import {
  GlobalOutlined,
  EyeOutlined,
  DeploymentUnitOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import {
  actionPrimary,
  statusOperational,
  statusDraft,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  surfaceCard,
  radiusMd,
  radiusPill,
} from '../../themetokenchk';
import type { MapLayer } from '../../types/mapLayer';
import { MapLayer as MapLayerEnum } from '../../types/mapLayer';

const fontSizeMd = 13.5;

export interface MapLayerDetailContentProps {
  selectedRecord: MapLayer;
}

const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
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

const LAYER_TYPE_LABELS: Record<string, string> = {
  [MapLayerEnum.LayerType.POINT]: 'Đối tượng điểm',
  [MapLayerEnum.LayerType.LINE]: 'Đối tượng đường',
  [MapLayerEnum.LayerType.POLYGON]: 'Đối tượng vùng',
  [MapLayerEnum.LayerType.BASEMAP]: 'Bản đồ nền',
  [MapLayerEnum.LayerType.OVERLAY]: 'Lớp phủ',
};

const LAYER_TYPE_COLORS: Record<string, string> = {
  [MapLayerEnum.LayerType.POINT]: '#0284C7',
  [MapLayerEnum.LayerType.LINE]: '#0E6FD6',
  [MapLayerEnum.LayerType.POLYGON]: '#1BAF7A',
  [MapLayerEnum.LayerType.BASEMAP]: '#EDA100',
  [MapLayerEnum.LayerType.OVERLAY]: '#8B5CF6',
};

export const MapLayerDetailContent: React.FC<MapLayerDetailContentProps> = ({
  selectedRecord,
}) => {
  const isOperational = selectedRecord.status === 'ACTIVE' || String(selectedRecord.status) === '1';
  const statusColor = isOperational ? statusOperational : statusDraft;
  const statusLabel = isOperational ? 'Hoạt động' : 'Không hoạt động';

  const typeColor = LAYER_TYPE_COLORS[selectedRecord.layerType] || actionPrimary;
  const typeLabel = LAYER_TYPE_LABELS[selectedRecord.layerType] || selectedRecord.layerType;

  const opacityPercent = typeof selectedRecord.opacity === 'number'
    ? selectedRecord.opacity > 1
      ? selectedRecord.opacity
      : Math.round(selectedRecord.opacity * 100)
    : 100;

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── Section 1: Thông tin lớp bản đồ ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <GlobalOutlined style={{ color: actionPrimary }} />
            Thông tin định danh lớp bản đồ
          </span>
        </div>
        <div
          className="chk-detail-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            columnGap: 24,
            rowGap: 12,
          }}
        >
          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Mã lớp bản đồ
            </div>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
              {selectedRecord.code || '—'}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Trạng thái
            </div>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: radiusPill,
                  padding: '2px 10px',
                  fontSize: fontSizeMd,
                  fontWeight: fontWeightMedium,
                  background: `${statusColor}15`,
                  border: `1px solid ${statusColor}40`,
                  color: statusColor,
                  whiteSpace: 'nowrap',
                }}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div
            style={{
              gridColumn: '1 / -1',
              padding: '8px 12px',
              background: surfaceCard,
              borderRadius: radiusMd,
            }}
          >
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Tên lớp bản đồ
            </div>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>
              {selectedRecord.name}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Phân loại lớp
            </div>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: radiusPill,
                  padding: '2px 10px',
                  fontSize: fontSizeMd,
                  fontWeight: fontWeightMedium,
                  background: `${typeColor}15`,
                  border: `1px solid ${typeColor}40`,
                  color: typeColor,
                  whiteSpace: 'nowrap',
                }}
              >
                {typeLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Cấu hình hiển thị GIS ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <EyeOutlined style={{ color: actionPrimary }} />
            Cấu hình hiển thị trên GIS
          </span>
        </div>
        <div
          className="chk-detail-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            columnGap: 20,
            rowGap: 12,
          }}
        >
          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Hiển thị mặc định
            </div>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
              {selectedRecord.visible ? 'Bật hiển thị' : 'Ẩn'}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Độ trong suốt
            </div>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
              {opacityPercent}%
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Thứ tự hiển thị
            </div>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
              {selectedRecord.order ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Nguồn dữ liệu & Cấu hình ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <DeploymentUnitOutlined style={{ color: actionPrimary }} />
            Nguồn dữ liệu & Cấu hình dịch vụ
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              URL nguồn dữ liệu / Dịch vụ bản đồ
            </div>
            <div
              style={{
                color: colors.textPrimary,
                fontFamily: 'monospace',
                fontSize: fontSizeSm,
                wordBreak: 'break-all',
              }}
            >
              {selectedRecord.source || '(Chưa cấu hình URL)'}
            </div>
          </div>

          {selectedRecord.styleConfig && (
            <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
              <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
                Cấu hình kiểu dáng (Style Config)
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 8,
                  background: '#f8fafc',
                  borderRadius: 4,
                  fontSize: 12,
                  overflowX: 'auto',
                }}
              >
                {selectedRecord.styleConfig}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Quản trị & Thời gian ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <AuditOutlined style={{ color: actionPrimary }} />
            Thông tin quản trị hệ thống
          </span>
        </div>
        <div
          className="chk-detail-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            columnGap: 24,
            rowGap: 12,
          }}
        >
          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Thời gian tạo lập
            </div>
            <div style={{ color: colors.textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>
              {selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Thời gian cập nhật gần nhất
            </div>
            <div style={{ color: colors.textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>
              {selectedRecord.updatedAt ? dayjs(selectedRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapLayerDetailContent;
