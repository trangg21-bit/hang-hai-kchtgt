import React, { useMemo, useState, useEffect } from 'react';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Buoy } from '../../types/beacon';
import type { BuoyStationResponse } from '../../services/buoy-station/types';
import type {
  BuoyAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
import { fetchInfraAssetAttachments } from '../../services/assetmovement/api';
import { fmtNum } from '../../utils/numFmt';
import InfrastructureAttachmentTab, {
  type InfrastructureAttachmentItem,
} from '../../components/shared/InfrastructureAttachmentTab';
import {
  colors,
  actionPrimary,
  textTertiary,
  fontSizeMd,
  fontWeightBold,
  statusOperational,
  statusAttention,
  statusCritical,
  statusDraft,
} from '../../themetokenchk';
import {
  DynamicViewSidebar,
  ViewFieldType,
  type ViewTabConfig,
} from '../../components/shared/dynamic-view-sidebar';

export interface BuoyAssetDetailContentProps {
  open: boolean;
  selectedRecord?: BuoyAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  buoyMap: Map<string, Buoy>;
  stationMap: Map<string, BuoyStationResponse>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
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

const APPROVAL_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: {
    color: statusAttention,
    label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  },
  CHO_PHE_DUYET: {
    color: statusAttention,
    label: 'Chờ phê duyệt cấp Cảng vụ/Chi cục',
  },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED_LEVEL2: { color: statusAttention, label: 'Chờ phê duyệt cấp cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: {
    color: statusCritical,
    label: 'Từ chối cấp Cảng vụ/Chi cục',
  },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp cục' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};

export default function BuoyAssetDetailContent({
  open,
  selectedRecord: rec,
  onClose,
  orgName,
  buoyMap,
  stationMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: BuoyAssetDetailContentProps) {
  const [detailAttachments, setDetailAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  useEffect(() => {
    if (!rec?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetailAttachments([]);
      return;
    }
    let isMounted = true;
    fetchInfraAssetAttachments(rec.id)
      .then((realAtts) => {
        if (!isMounted) return;
        if (realAtts && realAtts.length > 0) {
          setDetailAttachments(
            realAtts.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              fileSize: att.fileSize,
              fileType: att.contentType,
              uploadedByName: att.uploadedByName || rec.updatedByName || rec.submittedByName || '—',
              uploadedDate: att.uploadedAt || (rec.updatedAt ? dayjs(rec.updatedAt).toISOString() : dayjs().toISOString()),
              filePath: `/v1/asset/infra-assets/${rec.id}/attachments/${att.id}/download`,
            }))
          );
        } else if (rec.attachmentName) {
          setDetailAttachments(
            rec.attachmentName.split(',').map((name, i) => ({
              id: `detail-att-${i}`,
              fileName: name.trim(),
              fileSize: 1024 * 512,
              uploadedByName: rec.updatedByName || rec.submittedByName || '—',
              uploadedDate: rec.updatedAt ? dayjs(rec.updatedAt).toISOString() : dayjs().toISOString(),
            }))
          );
        } else {
          setDetailAttachments([]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        if (rec.attachmentName) {
          setDetailAttachments(
            rec.attachmentName.split(',').map((name, i) => ({
              id: `detail-att-${i}`,
              fileName: name.trim(),
              fileSize: 1024 * 512,
              uploadedByName: rec.updatedByName || rec.submittedByName || '—',
              uploadedDate: rec.updatedAt ? dayjs(rec.updatedAt).toISOString() : dayjs().toISOString(),
            }))
          );
        } else {
          setDetailAttachments([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [rec]);

  const viewTabs = useMemo<ViewTabConfig[]>(() => {
    if (!rec) return [];

    const refDisplay = (() => {
      if (rec.buoyId && buoyMap.has(rec.buoyId)) {
        const b = buoyMap.get(rec.buoyId)!;
        return `[Phao tiêu] ${b.code} - ${b.name}`;
      }
      if (rec.buoyStationId && stationMap.has(rec.buoyStationId)) {
        const s = stationMap.get(rec.buoyStationId)!;
        return `[Nhà trạm] ${s.code} - ${s.name}`;
      }
      return '—';
    })();

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'basic_info',
            title: 'Thông tin cơ bản & Quản lý vận hành',
            icon: <BankOutlined />,
            fields: [
              {
                name: 'parentOrgUnitId',
                label: 'Cơ quan quản lý cấp trên',
                render: (v) => orgName.get(v as string) || '—',
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                render: (v) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {orgName.get(v as string) || '—'}
                  </span>
                ),
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                render: (v) => orgName.get(v as string) || '—',
              },
              {
                name: 'refDisplay',
                label: 'Mã nhà trạm, phao tiêu',
                render: () => (
                  <span style={{ fontWeight: fontWeightBold, color: actionPrimary }}>
                    {refDisplay}
                  </span>
                ),
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: () => 'Tài sản phao, tiêu và nhà trạm QLVH',
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: ViewFieldType.Tag,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                render: (v) => (
                  <span
                    style={{
                      fontWeight: fontWeightBold,
                      color: colors.sidebarBg,
                    }}
                  >
                    {String(v || '—')}
                  </span>
                ),
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: ViewFieldType.Text,
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: ViewFieldType.Badge,
                badgeColor: (v) =>
                  v === 'Tốt'
                    ? statusOperational
                    : v === 'Hư hỏng cần sửa chữa'
                      ? statusAttention
                      : statusCritical,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: ViewFieldType.Badge,
                badgeColor: (v) =>
                  v === 'Đang sử dụng'
                    ? statusOperational
                    : v === 'Đang bảo trì/sửa chữa'
                      ? statusAttention
                      : statusDraft,
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: ViewFieldType.Text,
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
                type: ViewFieldType.Text,
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
                type: ViewFieldType.Text,
              },
              {
                name: 'address',
                label: 'Địa chỉ',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
          {
            key: 'specs_info',
            title: 'Chỉ số tổng hợp & Kỹ thuật',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                render: (_v, r) =>
                  r.quantity != null
                    ? `${fmtNum(r.quantity)} ${r.quantityUnit || ''}`.trim()
                    : '—',
              },
              {
                name: 'model',
                label: 'Model',
                type: ViewFieldType.Text,
              },
              {
                name: 'serialNumber',
                label: 'Số Serial',
                type: ViewFieldType.Text,
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: ViewFieldType.Text,
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: ViewFieldType.Text,
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng',
                type: ViewFieldType.Text,
              },
              {
                name: 'useDate',
                label: 'Ngày sử dụng tài sản',
                type: ViewFieldType.Date,
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m²)',
                render: (v) => (v != null ? `${fmtNum(Number(v))} m²` : '—'),
              },
              {
                name: 'floorArea',
                label: 'Diện tích sàn sử dụng (m²)',
                render: (v) => (v != null ? `${fmtNum(Number(v))} m²` : '—'),
              },
              {
                name: 'assetLocation',
                label: 'Vị trí tài sản',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
        ],
      },
      {
        key: 'files',
        label: `Hồ sơ tài sản (${detailAttachments.length})`,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={detailAttachments}
              readonly={true}
            />
          </div>
        ),
      },
      {
        key: 'detail',
        label: 'Thông tin chi tiết',
        sections: [
          {
            key: 'declaration_info',
            title: 'Kê khai & Xử lý tài sản',
            icon: <AuditOutlined />,
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: ViewFieldType.Date,
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
                type: ViewFieldType.Text,
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: ViewFieldType.Text,
              },
            ],
          },
          {
            key: 'depreciation_info',
            title: 'Thông tin giá trị & Khấu hao tài sản',
            icon: <SlidersOutlined />,
            fields: [
              {
                name: 'originalValue',
                label: 'Nguyên giá',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao',
                render: (v) => (v != null ? `${fmtNum(Number(v))}%` : '—'),
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: ViewFieldType.Text,
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Date,
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng',
                type: ViewFieldType.Number,
                suffix: 'VNĐ',
              },
            ],
          },
        ],
      },
      {
        key: 'exploit',
        label: `Khai thác tài sản (${exploitationRows.length})`,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            {exploitationRows.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 0',
                  color: textTertiary,
                }}
              >
                Chưa có lịch sử khai thác tài sản
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {exploitationRows.map((item, index) => (
                  <div key={item.id || index} style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        <RocketOutlined style={{ color: actionPrimary }} />
                        <span>Khai thác năm {item.exploitationYear || '—'}</span>
                      </div>
                      <span style={{ fontSize: 12, color: textTertiary }}>
                        {item.createdAt
                          ? dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')
                          : '—'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px 24px',
                        fontSize: fontSizeMd,
                      }}
                    >
                      <div>
                        <span style={{ color: textTertiary }}>
                          Đơn vị khai thác:{' '}
                        </span>
                        <span style={{ fontWeight: fontWeightBold }}>
                          {orgName.get(item.operatorOrgUnitId || '') || '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Thời hạn khai thác:{' '}
                        </span>
                        <span>
                          {item.exploitationDeadline
                            ? dayjs(item.exploitationDeadline).format(
                                'DD/MM/YYYY',
                              )
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Số lượng / ĐVT:{' '}
                        </span>
                        <span>
                          {item.quantity != null ? fmtNum(item.quantity) : '—'}{' '}
                          {item.unitOfMeasure || ''}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Tổng thu (VNĐ):{' '}
                        </span>
                        <span style={{ fontWeight: fontWeightBold, color: actionPrimary }}>
                          {item.totalRevenue != null
                            ? fmtNum(item.totalRevenue) + ' VNĐ'
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Chi phí liên quan (VNĐ):{' '}
                        </span>
                        <span>
                          {item.relatedCosts != null
                            ? fmtNum(item.relatedCosts) + ' VNĐ'
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Nộp NSNN (VNĐ):{' '}
                        </span>
                        <span>
                          {item.stateBudgetPayment != null
                            ? fmtNum(item.stateBudgetPayment) + ' VNĐ'
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Thực hiện dự án (VNĐ):{' '}
                        </span>
                        <span>
                          {item.projectAmount != null
                            ? fmtNum(item.projectAmount) + ' VNĐ'
                            : '—'}
                        </span>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: textTertiary }}>
                          Ghi chú khai thác:{' '}
                        </span>
                        <span>{item.description || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'valuation_history',
        label: `Lịch sử nguyên giá (${increaseRows.length + decreaseRows.length})`,
        customContent: () => {
          const allRows = [
            ...increaseRows.map((r) => ({ ...r, changeType: 'INCREASE' as const })),
            ...decreaseRows.map((r) => ({ ...r, changeType: 'DECREASE' as const })),
          ].sort(
            (a, b) =>
              dayjs(b.createdAt || 0).valueOf() -
              dayjs(a.createdAt || 0).valueOf(),
          );

          if (allRows.length === 0) {
            return (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 0',
                  color: textTertiary,
                }}
              >
                Chưa có lịch sử biến động nguyên giá
              </div>
            );
          }

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                paddingTop: 6,
              }}
            >
              {allRows.map((item, idx) => {
                const isInc = item.changeType === 'INCREASE';
                return (
                  <div key={item.id || idx} style={sectionBoxStyle}>
                    <div style={sectionHeaderStyle}>
                      <div style={sectionTitleStyle}>
                        {isInc ? (
                          <PlusCircleOutlined style={{ color: statusOperational }} />
                        ) : (
                          <MinusCircleOutlined style={{ color: statusCritical }} />
                        )}
                        <span>
                          {isInc
                            ? 'Tăng nguyên giá tài sản'
                            : 'Giảm nguyên giá tài sản'}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: textTertiary }}>
                        {item.adjustmentDate
                          ? dayjs(item.adjustmentDate).format('DD/MM/YYYY')
                          : item.createdAt
                            ? dayjs(item.createdAt).format('DD/MM/YYYY')
                            : '—'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px 24px',
                        fontSize: fontSizeMd,
                      }}
                    >
                      <div>
                        <span style={{ color: textTertiary }}>
                          Số quyết định:{' '}
                        </span>
                        <span style={{ fontWeight: fontWeightBold }}>
                          {item.decisionNumber || '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Ngày ra quyết định:{' '}
                        </span>
                        <span>
                          {item.decisionDate
                            ? dayjs(item.decisionDate).format('DD/MM/YYYY')
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Lý do điều chỉnh:{' '}
                        </span>
                        <span>{item.adjustmentReason || '—'}</span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Giá trị điều chỉnh:{' '}
                        </span>
                        <span
                          style={{
                            fontWeight: fontWeightBold,
                            color: isInc ? statusOperational : statusCritical,
                          }}
                        >
                          {isInc ? '+' : '-'}
                          {fmtNum(
                            Math.abs(
                              (item.originalValueAfter || 0) -
                                (item.originalValueBefore || 0),
                            ),
                          )}{' '}
                          VNĐ
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Nguyên giá trước:{' '}
                        </span>
                        <span>
                          {item.originalValueBefore != null
                            ? fmtNum(item.originalValueBefore) + ' VNĐ'
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Nguyên giá sau:{' '}
                        </span>
                        <span style={{ fontWeight: fontWeightBold }}>
                          {item.originalValueAfter != null
                            ? fmtNum(item.originalValueAfter) + ' VNĐ'
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Giá trị còn lại trước:{' '}
                        </span>
                        <span>
                          {item.remainingValueBefore != null
                            ? fmtNum(item.remainingValueBefore) + ' VNĐ'
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Giá trị còn lại sau:{' '}
                        </span>
                        <span style={{ fontWeight: fontWeightBold }}>
                          {item.remainingValueAfter != null
                            ? fmtNum(item.remainingValueAfter) + ' VNĐ'
                            : '—'}
                        </span>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: textTertiary }}>Ghi chú: </span>
                        <span>{item.adjustmentNotes || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        key: 'tracking',
        label: 'Xử lý & theo dõi',
        sections: [
          {
            key: 'tracking_info',
            title: 'Lịch sử xử lý & theo dõi',
            icon: <AuditOutlined />,
            fields: [
              {
                name: 'approvalStatus',
                label: 'Trạng thái',
                render: (v) => {
                  const s = String(v || 'DRAFT');
                  const cfg = APPROVAL_MAP[s] || {
                    color: statusDraft,
                    label: s,
                  };
                  return (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: cfg.color,
                        background: `${cfg.color}15`,
                        border: `1px solid ${cfg.color}40`,
                      }}
                    >
                      {cfg.label}
                    </span>
                  );
                },
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                type: ViewFieldType.Text,
              },
              {
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
                type: ViewFieldType.Text,
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Text,
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                type: ViewFieldType.Text,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt cấp Cục',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
        ],
      },
    ];
  }, [
    rec,
    orgName,
    buoyMap,
    stationMap,
    detailAttachments,
    exploitationRows,
    increaseRows,
    decreaseRows,
  ]);

  return (
    <DynamicViewSidebar
      open={open}
      title={`Chi tiết tài sản phao, tiêu và nhà trạm — ${rec?.assetName || rec?.assetCode || ''}`}
      onClose={onClose}
      record={rec}
      tabs={viewTabs}
      width={
        typeof window !== 'undefined'
          ? Math.min(1000, Math.floor(window.innerWidth * 0.95))
          : 1000
      }
    />
  );
}
