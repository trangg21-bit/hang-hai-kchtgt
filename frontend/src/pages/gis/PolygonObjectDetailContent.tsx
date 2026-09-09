import React from 'react';
import {
  BankOutlined,
  EnvironmentOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors, statusBadgeStyle } from '../../themetokenchk';
import {
  actionPrimary,
  statusOperational,
  statusCritical,
  fontWeightBold,
  surfacePage,
  borderDefault,
  radiusMd,
  formatUserDisplayName,
} from '../../themetokenchk';
import type { SpatialObjectCategory } from '../../services/spatialObjectCategoryService';
import type { Symbol as MapSymbolItem } from '../../services/symbolService';

const fontSizeMd = 13.5;

export interface PolygonObjectDetailContentProps {
  selectedRecord: SpatialObjectCategory;
  symbols?: MapSymbolItem[];
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

export const PolygonObjectDetailContent: React.FC<PolygonObjectDetailContentProps> = ({
  selectedRecord,
  symbols = [],
  userMap,
}) => {
  const sym = symbols.find((s) => s.id === selectedRecord.iconId);
  const imgSrc = selectedRecord.iconUrl || sym?.image;
  const isOperational = selectedRecord.status === 1;
  const statusColor = isOperational ? statusOperational : statusCritical;
  const statusLabel = isOperational ? 'Sử dụng' : 'Khóa';

  return (
    <div className="polygon-detail-content-wrapper">
      <style>{`
        .polygon-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .polygon-detail-content-wrapper,
        .polygon-detail-content-wrapper .chk-detail-label,
        .polygon-detail-content-wrapper .chk-detail-value {
          font-size: 13.5px !important;
        }

        .polygon-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .polygon-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .polygon-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .polygon-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .polygon-detail-content-wrapper .chk-detail-label {
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

        .polygon-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .polygon-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .polygon-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .polygon-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }

        @media (max-width: 640px) {
          .polygon-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .polygon-detail-content-wrapper .chk-detail-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* ── Section 1: Thông tin định danh & phân loại ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <BankOutlined style={{ color: actionPrimary }} />
            Thông tin định danh & phân loại
          </span>
        </div>
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label">Mã đối tượng vùng</span>
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
            <span className="chk-detail-label">Tên đối tượng vùng</span>
            <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              {selectedRecord.name || '—'}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Loại hình học GIS</span>
            <span className="chk-detail-value">Đối tượng vùng (Polygon)</span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Ký hiệu bản đồ</span>
            <span className="chk-detail-value">
              {sym ? `${sym.name} (${sym.code})` : selectedRecord.iconId ? 'Đã gán biểu tượng' : '—'}
            </span>
          </div>

          {selectedRecord.description && (
            <div className="chk-detail-row chk-detail-row--full">
              <span className="chk-detail-label">Mô tả chức năng</span>
              <span className="chk-detail-value">{selectedRecord.description}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Biểu tượng thể hiện trên bản đồ ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            Biểu tượng thể hiện trên bản đồ
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '12px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: radiusMd,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: surfacePage,
              border: `1px solid ${borderDefault}`,
              borderRadius: radiusMd,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={selectedRecord.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <EnvironmentOutlined style={{ fontSize: 28, color: colors.textTertiary }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: colors.textSecondary, marginBottom: 2 }}>
              Biểu tượng liên kết
            </div>
            <div style={{ fontSize: 14.5, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              {sym ? `${sym.name} (${sym.code})` : selectedRecord.iconId ? 'Đã liên kết biểu tượng' : 'Chưa gán biểu tượng'}
            </div>
            {sym?.category && (
              <div style={{ fontSize: 13.5, color: colors.textTertiary, marginTop: 2 }}>
                Phân loại: {sym.category}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Thông tin cập nhật & Quản trị ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <AuditOutlined style={{ color: actionPrimary }} />
            Thông tin quản trị hệ thống
          </span>
        </div>
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label">Cán bộ cập nhật gần nhất</span>
            <span className="chk-detail-value">
              {formatUserDisplayName(
                selectedRecord.updatedBy,
                (selectedRecord as any).updatedByName,
                userMap,
                selectedRecord.createdBy,
                (selectedRecord as any).createdByName
              )}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Thời gian cập nhật gần nhất</span>
            <span className="chk-detail-value">
              {selectedRecord.updatedAt
                ? dayjs(selectedRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss')
                : selectedRecord.createdAt
                ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss')
                : '—'}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Thời gian tạo lập</span>
            <span className="chk-detail-value">
              {selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolygonObjectDetailContent;
