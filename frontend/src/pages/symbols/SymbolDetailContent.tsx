import React from 'react';
import {
  PictureOutlined,
  BankOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { colors, statusBadgeStyle } from '../../themetokenchk';
import {
  actionPrimary,
  statusOperational,
  statusDraft,
  fontWeightBold,
  surfacePage,
  borderDefault,
  radiusMd,
  formatUserDisplayName,
} from '../../themetokenchk';
import type { Symbol } from '../../services/symbolService';

const fontSizeMd = 13.5;

export interface SymbolDetailContentProps {
  selectedRecord: Symbol;
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

export const SymbolDetailContent: React.FC<SymbolDetailContentProps> = ({
  selectedRecord,
  userMap,
}) => {
  const isOperational = selectedRecord.status === 'active';
  const statusColor = isOperational ? statusOperational : statusDraft;
  const statusLabel = isOperational ? 'Sử dụng' : 'Không sử dụng';

  return (
    <div className="symbol-detail-content-wrapper">
      <style>{`
        .symbol-detail-content-wrapper {
          overflow-x: hidden !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .symbol-detail-content-wrapper,
        .symbol-detail-content-wrapper .chk-detail-label,
        .symbol-detail-content-wrapper .chk-detail-value {
          font-size: 13.5px !important;
        }

        .symbol-detail-content-wrapper .chk-detail-grid {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          column-gap: 28px !important;
          row-gap: 0 !important;
        }

        .symbol-detail-content-wrapper .chk-detail-row {
          display: flex !important;
          align-items: flex-start !important;
          min-height: 36px !important;
          padding: 7px 0 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          line-height: 1.5 !important;
          gap: 10px !important;
        }

        .symbol-detail-content-wrapper .chk-detail-row:last-child {
          border-bottom: none !important;
        }

        .symbol-detail-content-wrapper .chk-detail-row--full {
          grid-column: 1 / -1 !important;
        }

        .symbol-detail-content-wrapper .chk-detail-label {
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

        .symbol-detail-content-wrapper .chk-detail-label::after {
          content: ':' !important;
          margin-left: 1px !important;
          margin-right: 4px !important;
        }

        .symbol-detail-content-wrapper .chk-detail-value {
          color: #1e293b !important;
          font-size: 13.5px !important;
          flex: 1 !important;
          min-width: 0 !important;
          text-align: left !important;
          line-height: 1.5 !important;
          word-break: break-word !important;
        }

        @media (max-width: 960px) {
          .symbol-detail-content-wrapper .chk-detail-grid {
            grid-template-columns: 1fr !important;
            column-gap: 0 !important;
          }
          .symbol-detail-content-wrapper .chk-detail-row--full {
            grid-column: 1 !important;
          }
        }

        @media (max-width: 640px) {
          .symbol-detail-content-wrapper .chk-detail-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 3px !important;
            padding: 6px 0 !important;
          }
          .symbol-detail-content-wrapper .chk-detail-label {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* ── Section 1: Hình ảnh nhận diện biểu tượng ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <PictureOutlined style={{ color: actionPrimary }} />
            Hình ảnh & nhận diện biểu tượng
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '14px 18px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: radiusMd,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
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
            <div style={{ fontSize: 15.5, fontWeight: fontWeightBold, color: colors.sidebarBg, marginBottom: 4 }}>
              {selectedRecord.name}
            </div>
            <div style={{ fontSize: 13.5, color: colors.textSecondary, marginBottom: 6 }}>
              Mã ký hiệu: <strong>{selectedRecord.code || '—'}</strong>
            </div>
            <div>
              <span style={statusBadgeStyle(statusColor)}>{statusLabel}</span>
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
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label">Mã biểu tượng</span>
            <span className="chk-detail-value">
              {selectedRecord.code ? (
                <span style={statusBadgeStyle(actionPrimary)}>{selectedRecord.code}</span>
              ) : (
                '—'
              )}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Trạng thái sử dụng</span>
            <span className="chk-detail-value">
              <span style={statusBadgeStyle(statusColor)}>{statusLabel}</span>
            </span>
          </div>

          <div className="chk-detail-row chk-detail-row--full">
            <span className="chk-detail-label">Tên biểu tượng</span>
            <span className="chk-detail-value" style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              {selectedRecord.name || '—'}
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

      {/* ── Section 3: Thông tin quản trị & Thời gian ── */}
      <div style={sectionBoxStyle}>
        <div style={sectionHeaderStyle}>
          <span style={sectionTitleStyle}>
            <AuditOutlined style={{ color: actionPrimary }} />
            Thông tin quản trị hệ thống
          </span>
        </div>
        <div className="chk-detail-grid">
          <div className="chk-detail-row">
            <span className="chk-detail-label">Cán bộ tạo lập</span>
            <span className="chk-detail-value">
              {formatUserDisplayName(selectedRecord.createdBy, selectedRecord.createdByName, userMap)}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Thời gian tạo lập</span>
            <span className="chk-detail-value">
              {selectedRecord.createdAt ? dayjs(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
            </span>
          </div>

          <div className="chk-detail-row">
            <span className="chk-detail-label">Cán bộ cập nhật gần nhất</span>
            <span className="chk-detail-value">
              {formatUserDisplayName(
                selectedRecord.updatedBy,
                selectedRecord.updatedByName,
                userMap,
                selectedRecord.createdBy,
                selectedRecord.createdByName
              )}
            </span>
          </div>

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

export default SymbolDetailContent;
