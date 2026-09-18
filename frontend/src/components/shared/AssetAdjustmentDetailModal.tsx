import {
  AuditOutlined,
  DollarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Button, Col, Modal, Row } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { renderApprovalStatusBadge } from './common-table';
import {
  actionPrimary,
  borderDefault,
  colors,
  fontSizeLg,
  fontSizeMd,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  radiusMd,
  radiusPill,
  statusCritical,
  statusOperational,
  textPrimary,
  textSecondary,
  textTertiary,
} from '../../themetokenchk';
import { fmtNum } from '../../utils/numFmt';

export interface AssetAdjustmentDetailRecord extends Record<string, unknown> {
  id?: string;
  assetId?: string;
  assetCode?: string;
  assetName?: string;
  adjustmentType?: string;
  changeType?: string;
  code?: string;
  decisionNumber?: string;
  decisionDate?: string;
  adjustmentDate?: string;
  originalValueBefore?: number;
  originalValueAfter?: number;
  remainingValueBefore?: number;
  remainingValueAfter?: number;
  adjustmentReason?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  createdByName?: string;
  updatedAt?: string;
  updatedByName?: string;
  adjustmentDetails?: Record<string, unknown>;
}

export interface AssetAdjustmentDetailModalProps {
  open: boolean;
  onClose: () => void;
  record?: AssetAdjustmentDetailRecord | null;
}

const formatDate = (val?: unknown): string => {
  if (!val) return '—';
  const str = String(val).trim();
  if (!str) return '—';
  const d = dayjs(str);
  return d.isValid() ? d.format('DD/MM/YYYY') : str;
};

const formatMoney = (val?: unknown): string => {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `${fmtNum(num)} VNĐ`;
};

export const AssetAdjustmentDetailModal: React.FC<AssetAdjustmentDetailModalProps> = ({
  open,
  onClose,
  record,
}) => {
  if (!record) return null;

  const details = (record.adjustmentDetails as Record<string, unknown>) || {};

  const isIncrease =
    record.adjustmentType === 'TANG' ||
    record.adjustmentType === 'INCREASE' ||
    record.changeType === 'Tăng nguyên giá' ||
    String(record.adjustmentType || '').toLowerCase().includes('tăng');

  const decisionNumber =
    String(
      record.decisionNumber ||
        details.decisionNumber ||
        record.code ||
        record.increaseCode ||
        record.decreaseCode ||
        ''
    ).trim() || '—';

  const decisionDate =
    record.decisionDate || details.decisionDate || (record.createdDate as string);
  const adjustmentDate =
    record.adjustmentDate ||
    details.adjustmentDate ||
    (record.increaseDate as string) ||
    (record.decreaseDate as string);

  const originalBefore =
    (record.originalValueBefore as number) ??
    (details.originalValueBefore as number) ??
    (record.originalValue as number) ??
    undefined;

  const originalAfter =
    (record.originalValueAfter as number) ??
    (details.originalValueAfter as number) ??
    undefined;

  const remainingBefore =
    (record.remainingValueBefore as number) ??
    (details.remainingValueBefore as number) ??
    (record.remainingValue as number) ??
    undefined;

  const remainingAfter =
    (record.remainingValueAfter as number) ??
    (details.remainingValueAfter as number) ??
    undefined;

  const originalDiff =
    originalAfter !== undefined && originalBefore !== undefined
      ? originalAfter - originalBefore
      : undefined;

  const adjustmentReason =
    String(
      record.adjustmentReason ||
        details.adjustmentReason ||
        record.increaseReason ||
        record.decreaseReason ||
        ''
    ).trim() || '—';

  const notes =
    String(
      record.notes ||
        details.adjustmentNotes ||
        details.notes ||
        record.description ||
        ''
    ).trim() || '—';

  const status =
    String(record.status || details.status || record.approvalStatus || '').trim() ||
    undefined;

  const createdAt =
    record.createdAt || (record.createdDate as string) || (details.createdAt as string);

  const sectionStyle: React.CSSProperties = {
    background: '#ffffff',
    border: `1px solid ${borderDefault}`,
    borderRadius: radiusMd,
    padding: '16px 20px',
    marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: `1px solid ${borderDefault}`,
    fontSize: fontSizeMd,
    fontWeight: fontWeightBold,
    color: colors.sidebarBg,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: fontSizeSm,
    color: textSecondary,
    marginBottom: 4,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: fontSizeMd,
    fontWeight: fontWeightMedium,
    color: textPrimary,
    wordBreak: 'break-word',
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={780}
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: radiusPill,
              background: `${actionPrimary}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: actionPrimary,
              fontSize: 16,
            }}
          >
            <AuditOutlined />
          </div>
          <span style={{ fontSize: fontSizeLg, fontWeight: fontWeightBold, color: colors.sidebarBg }}>
            Chi tiết biến động — Thay đổi nguyên giá
          </span>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 0 2px' }}>
          <Button
            type="primary"
            onClick={onClose}
            style={{
              borderRadius: radiusPill,
              height: 38,
              paddingInline: 28,
              fontWeight: fontWeightMedium,
              background: colors.sidebarBg,
              borderColor: colors.sidebarBg,
            }}
          >
            Đóng
          </Button>
        </div>
      }
    >
      <div style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto', paddingRight: 4 }}>
        {/* Section 1: Thông tin điều chỉnh & Quyết định */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <FileTextOutlined style={{ color: actionPrimary }} />
            <span>Thông tin quyết định & Thời gian điều chỉnh</span>
          </div>
          <Row gutter={[16, 14]}>
            <Col span={12}>
              <div style={labelStyle}>Loại biến động</div>
              <div>
                {isIncrease ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 12px',
                      borderRadius: radiusPill,
                      fontSize: fontSizeSm,
                      fontWeight: fontWeightMedium,
                      background: `${statusOperational}15`,
                      border: `1px solid ${statusOperational}40`,
                      color: statusOperational,
                    }}
                  >
                    <PlusCircleOutlined /> Tăng nguyên giá
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 12px',
                      borderRadius: radiusPill,
                      fontSize: fontSizeSm,
                      fontWeight: fontWeightMedium,
                      background: `${statusCritical}15`,
                      border: `1px solid ${statusCritical}40`,
                      color: statusCritical,
                    }}
                  >
                    <MinusCircleOutlined /> Giảm nguyên giá
                  </span>
                )}
              </div>
            </Col>
            <Col span={12}>
              <div style={labelStyle}>Số quyết định</div>
              <div style={{ ...valueStyle, fontWeight: fontWeightBold }}>{decisionNumber}</div>
            </Col>
            <Col span={12}>
              <div style={labelStyle}>Ngày ra quyết định</div>
              <div style={valueStyle}>{formatDate(decisionDate)}</div>
            </Col>
            <Col span={12}>
              <div style={labelStyle}>Ngày điều chỉnh</div>
              <div style={valueStyle}>{formatDate(adjustmentDate)}</div>
            </Col>
            {status && (
              <Col span={12}>
                <div style={labelStyle}>Trạng thái</div>
                <div>{renderApprovalStatusBadge(status)}</div>
              </Col>
            )}
            <Col span={12}>
              <div style={labelStyle}>Ngày cập nhật</div>
              <div style={valueStyle}>{formatDate(createdAt)}</div>
            </Col>
          </Row>
        </div>

        {/* Section 2: Giá trị nguyên giá & Giá trị còn lại */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <DollarOutlined style={{ color: actionPrimary }} />
            <span>Thông tin nguyên giá & Giá trị còn lại</span>
          </div>
          <Row gutter={[16, 14]}>
            <Col span={12}>
              <div style={labelStyle}>Nguyên giá trước điều chỉnh</div>
              <div style={{ ...valueStyle, fontSize: fontSizeMd }}>
                {formatMoney(originalBefore)}
              </div>
            </Col>
            <Col span={12}>
              <div style={labelStyle}>Nguyên giá sau điều chỉnh</div>
              <div
                style={{
                  ...valueStyle,
                  fontSize: fontSizeMd,
                  fontWeight: fontWeightBold,
                  color: isIncrease ? statusOperational : statusCritical,
                }}
              >
                {formatMoney(originalAfter)}
              </div>
            </Col>

            {originalDiff !== undefined && (
              <Col span={24}>
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: radiusMd,
                    padding: '8px 0',
                    border: `1px dashed ${borderDefault}`,
                  }}
                >
                  <Row gutter={[16, 0]} align="middle">
                    <Col span={12} style={{ paddingLeft: 14 }}>
                      <span style={{ fontSize: fontSizeSm, color: textSecondary }}>
                        Chênh lệch nguyên giá:
                      </span>
                    </Col>
                    <Col span={12}>
                      <span
                        style={{
                          fontSize: fontSizeMd,
                          fontWeight: fontWeightBold,
                          color: originalDiff >= 0 ? statusOperational : statusCritical,
                        }}
                      >
                        {originalDiff >= 0 ? `+ ${fmtNum(originalDiff)} VNĐ` : `- ${fmtNum(Math.abs(originalDiff))} VNĐ`}
                      </span>
                    </Col>
                  </Row>
                </div>
              </Col>
            )}

            <Col span={12}>
              <div style={labelStyle}>Giá trị còn lại trước điều chỉnh</div>
              <div style={valueStyle}>{formatMoney(remainingBefore)}</div>
            </Col>
            <Col span={12}>
              <div style={labelStyle}>Giá trị còn lại sau điều chỉnh</div>
              <div style={valueStyle}>{formatMoney(remainingAfter)}</div>
            </Col>
          </Row>
        </div>

        {/* Section 3: Lý do điều chỉnh & Ghi chú */}
        <div style={{ ...sectionStyle, marginBottom: 0 }}>
          <div style={sectionHeaderStyle}>
            <InfoCircleOutlined style={{ color: actionPrimary }} />
            <span>Lý do điều chỉnh & Ghi chú</span>
          </div>
          <Row gutter={[16, 14]}>
            <Col span={24}>
              <div style={labelStyle}>Lý do điều chỉnh</div>
              <div
                style={{
                  ...valueStyle,
                  background: '#f8fafc',
                  border: `1px solid ${borderDefault}`,
                  borderRadius: radiusMd,
                  padding: '10px 14px',
                  minHeight: 42,
                  color: adjustmentReason === '—' ? textTertiary : textPrimary,
                }}
              >
                {adjustmentReason}
              </div>
            </Col>
            <Col span={24}>
              <div style={labelStyle}>Ghi chú</div>
              <div
                style={{
                  ...valueStyle,
                  background: '#f8fafc',
                  border: `1px solid ${borderDefault}`,
                  borderRadius: radiusMd,
                  padding: '10px 14px',
                  minHeight: 42,
                  color: notes === '—' ? textTertiary : textPrimary,
                }}
              >
                {notes}
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Modal>
  );
};

export default AssetAdjustmentDetailModal;
