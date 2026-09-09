import React from 'react';
import {
  GlobalOutlined,
  EyeOutlined,
  DeploymentUnitOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors, statusBadgeStyle } from '../../themetokenchk';
import {
  actionPrimary,
  statusOperational,
  statusDraft,
  fontWeightBold,
  formatUserDisplayName,
} from '../../themetokenchk';
import type { MapLayer } from '../../types/mapLayer';
import { MapLayer as MapLayerEnum } from '../../types/mapLayer';

const fontSizeMd = 13.5;

export interface MapLayerDetailContentProps {
  selectedRecord: MapLayer;
  userMap?: Map<string, string>;
}

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
  userMap,
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
    <div className="maplayer-detail-content-wrapper">
      <style>{`
        .maplayer-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .maplayer-detail-content-wrapper,
        .maplayer-detail-content-wrapper .chk-detail-label,
        .maplayer-detail-content-wrapper .chk-detail-value {
          font-size: 13.5px !important;
        }

        .maplayer-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .maplayer-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .maplayer-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .maplayer-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .maplayer-detail-content-wrapper .chk-detail-label {
          width: 200px !important;
          min-width: 200px !important;
          max-width: 200px !important;
          flex-shrink: 0 !important;
          color: ${colors.sidebarBg} !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          text-align: left !important;
          line-height: 1.5 !important;
        }

        .maplayer-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .maplayer-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .maplayer-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .maplayer-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }

        @media (max-width: 640px) {
          .maplayer-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .maplayer-detail-content-wrapper .chk-detail-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* ── Section 1: Thông tin định danh lớp bản đồ ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <GlobalOutlined style={{ color: actionPrimary }} />
            Thông tin định danh lớp bản đồ
          </span>
        </div>
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label">Mã lớp bản đồ</span>
            <span className="chk-detail-value">
              {selectedRecord.code ? (
                <span style={statusBadgeStyle(actionPrimary)}>{selectedRecord.code}</span>
              ) : (
                '—'
              )}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Trạng thái</span>
            <span className="chk-detail-value">
              <span style={statusBadgeStyle(statusColor)}>{statusLabel}</span>
            </span>
          </div>

          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label">Tên lớp bản đồ</span>
            <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              {selectedRecord.name || '—'}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Phân loại lớp</span>
            <span className="chk-detail-value">
              <span style={statusBadgeStyle(typeColor)}>{typeLabel}</span>
            </span>
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
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label">Hiển thị mặc định</span>
            <span className="chk-detail-value">
              <span style={statusBadgeStyle(selectedRecord.visible ? statusOperational : statusDraft)}>
                {selectedRecord.visible ? 'Bật hiển thị' : 'Ẩn'}
              </span>
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Độ trong suốt</span>
            <span className="chk-detail-value">{opacityPercent}%</span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Thứ tự hiển thị</span>
            <span className="chk-detail-value">{selectedRecord.order ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ── Section 3: Nguồn dữ liệu & Cấu hình dịch vụ ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <DeploymentUnitOutlined style={{ color: actionPrimary }} />
            Nguồn dữ liệu & Cấu hình dịch vụ
          </span>
        </div>
        <div className="chk-detail-grid">
          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label">URL nguồn dữ liệu</span>
            <span
              className="chk-detail-value"
              style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}
            >
              {selectedRecord.source || '(Chưa cấu hình URL)'}
            </span>
          </div>

          {selectedRecord.styleConfig && (
            <div className="chk-detail-row chk-detail-row--full">
              <span className="chk-detail-label">Cấu hình kiểu dáng</span>
              <span className="chk-detail-value">
                <pre
                  style={{
                    margin: 0,
                    padding: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 4,
                    fontSize: 12.5,
                    overflowX: 'auto',
                  }}
                >
                  {selectedRecord.styleConfig}
                </pre>
              </span>
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
        <div className="chk-detail-grid">
          {((selectedRecord as any).createdBy || (selectedRecord as any).createdByName) && (
            <div className="chk-detail-row">
              <span className="chk-detail-label">Cán bộ tạo lập</span>
              <span className="chk-detail-value">
                {formatUserDisplayName((selectedRecord as any).createdBy, (selectedRecord as any).createdByName, userMap)}
              </span>
            </div>
          )}

          <div className="chk-detail-row">
            <span className="chk-detail-label">Thời gian tạo lập</span>
            <span className="chk-detail-value">
              {selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </span>
          </div>

          {((selectedRecord as any).updatedBy || (selectedRecord as any).updatedByName) && (
            <div className="chk-detail-row">
              <span className="chk-detail-label">Cán bộ cập nhật gần nhất</span>
              <span className="chk-detail-value">
                {formatUserDisplayName(
                  (selectedRecord as any).updatedBy,
                  (selectedRecord as any).updatedByName,
                  userMap,
                  (selectedRecord as any).createdBy,
                  (selectedRecord as any).createdByName
                )}
              </span>
            </div>
          )}

          <div className="chk-detail-row">
            <span className="chk-detail-label">Thời gian cập nhật gần nhất</span>
            <span className="chk-detail-value">
              {selectedRecord.updatedAt ? dayjs(selectedRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapLayerDetailContent;
