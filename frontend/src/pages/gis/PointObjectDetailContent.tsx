import React from 'react';
import {
  BankOutlined,
  EnvironmentOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors } from '../../themetokenchk';
import {
  actionPrimary,
  statusOperational,
  statusCritical,
  fontSizeSm,
  fontWeightMedium,
  fontWeightBold,
  surfaceCard,
  surfacePage,
  borderDefault,
  radiusMd,
  radiusPill,
} from '../../themetokenchk';
import type { SpatialObjectCategory } from '../../services/spatialObjectCategoryService';
import type { Symbol as MapSymbolItem } from '../../services/symbolService';

const fontSizeMd = 13.5;

export interface PointObjectDetailContentProps {
  selectedRecord: SpatialObjectCategory;
  symbols?: MapSymbolItem[];
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

export const PointObjectDetailContent: React.FC<PointObjectDetailContentProps> = ({
  selectedRecord,
  symbols = [],
}) => {
  const sym = symbols.find((s) => s.id === selectedRecord.iconId);
  const imgSrc = selectedRecord.iconUrl || sym?.image;
  const isOperational = selectedRecord.status === 1;
  const statusColor = isOperational ? statusOperational : statusCritical;
  const statusLabel = isOperational ? 'Sử dụng' : 'Khóa';

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── Section 1: Thông tin chung ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <BankOutlined style={{ color: actionPrimary }} />
            Thông tin định danh & phân loại
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
              Mã đối tượng điểm
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
              Tên đối tượng điểm
            </div>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>
              {selectedRecord.name}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Loại hình học GIS
            </div>
            <div style={{ color: colors.textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>
              Đối tượng điểm (Point)
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Cấu hình biểu tượng bản đồ ── */}
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
            background: surfaceCard,
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
            <div style={{ fontSize: fontSizeSm, color: colors.textSecondary, marginBottom: 2 }}>
              Biểu tượng liên kết
            </div>
            <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              {sym ? `${sym.name} (${sym.code})` : selectedRecord.iconId ? 'Đã liên kết biểu tượng' : 'Chưa gán biểu tượng'}
            </div>
            {sym?.category && (
              <div style={{ fontSize: fontSizeSm, color: colors.textTertiary, marginTop: 2 }}>
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
              Cán bộ cập nhật gần nhất
            </div>
            <div style={{ color: colors.textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>
              {selectedRecord.updatedBy || selectedRecord.createdBy || 'SYSTEM'}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Thời gian cập nhật gần nhất
            </div>
            <div style={{ color: colors.textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>
              {selectedRecord.updatedAt
                ? dayjs(selectedRecord.updatedAt).format('DD/MM/YYYY HH:mm:ss')
                : selectedRecord.createdAt
                ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss')
                : '—'}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Thời gian tạo lập
            </div>
            <div style={{ color: colors.textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>
              {selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointObjectDetailContent;
