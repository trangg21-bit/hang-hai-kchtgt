import React from 'react';
import {
  PictureOutlined,
  BankOutlined,
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
  surfacePage,
  borderDefault,
  radiusMd,
  radiusPill,
} from '../../themetokenchk';
import type { Symbol } from '../../services/symbolService';

const fontSizeMd = 13.5;

export interface SymbolDetailContentProps {
  selectedRecord: Symbol;
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

export const SymbolDetailContent: React.FC<SymbolDetailContentProps> = ({
  selectedRecord,
}) => {
  const isOperational = selectedRecord.status === 'active';
  const statusColor = isOperational ? statusOperational : statusDraft;
  const statusLabel = isOperational ? 'Sử dụng' : 'Không sử dụng';

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* ── Section 1: Hình ảnh biểu tượng ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <PictureOutlined style={{ color: actionPrimary }} />
            Hình ảnh biểu tượng
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '16px 20px',
            background: surfaceCard,
            borderRadius: radiusMd,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              background: surfacePage,
              border: `1px solid ${borderDefault}`,
              borderRadius: radiusMd,
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {selectedRecord.image ? (
              <img
                src={selectedRecord.image}
                alt={selectedRecord.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <PictureOutlined style={{ fontSize: 36, color: colors.textTertiary }} />
            )}
          </div>
          <div>
            <div style={{ fontSize: fontSizeMd + 2, fontWeight: fontWeightBold, color: colors.sidebarBg, marginBottom: 4 }}>
              {selectedRecord.name}
            </div>
            <div style={{ fontSize: fontSizeMd, color: colors.textSecondary, marginBottom: 6 }}>
              Mã ký hiệu: <strong>{selectedRecord.code || '—'}</strong>
            </div>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: radiusPill,
                  padding: '2px 10px',
                  fontSize: fontSizeSm,
                  fontWeight: fontWeightMedium,
                  background: `${statusColor}15`,
                  border: `1px solid ${statusColor}40`,
                  color: statusColor,
                }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Thông tin định danh & Chi tiết ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <BankOutlined style={{ color: actionPrimary }} />
            Thông tin định danh & mô tả
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
              Mã biểu tượng
            </div>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
              {selectedRecord.code || '—'}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Trạng thái sử dụng
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
              Tên biểu tượng
            </div>
            <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd + 1 }}>
              {selectedRecord.name}
            </div>
          </div>

          {selectedRecord.description && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '8px 12px',
                background: surfaceCard,
                borderRadius: radiusMd,
              }}
            >
              <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
                Mô tả chức năng / Công năng biểu tượng
              </div>
              <div style={{ color: colors.textPrimary, fontSize: fontSizeMd, lineHeight: 1.5 }}>
                {selectedRecord.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Thông tin quản trị & Thời gian ── */}
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
              Cán bộ tạo lập
            </div>
            <div style={{ color: colors.textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>
              {selectedRecord.createdByName || selectedRecord.createdBy || 'SYSTEM'}
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

          <div style={{ padding: '8px 12px', background: surfaceCard, borderRadius: radiusMd }}>
            <div style={{ color: colors.textSecondary, fontSize: fontSizeSm, marginBottom: 4 }}>
              Cán bộ cập nhật gần nhất
            </div>
            <div style={{ color: colors.textPrimary, fontWeight: fontWeightMedium, fontSize: fontSizeMd }}>
              {selectedRecord.updatedByName || selectedRecord.updatedBy || selectedRecord.createdByName || 'SYSTEM'}
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

export default SymbolDetailContent;
