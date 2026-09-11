import React, { useMemo } from 'react';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { NavigationChannelResponse } from '../../types/navigationChannel';
import type {
  ChannelAsset,
  AssetExploitationResponse,
  AssetIncreaseResponse,
  AssetDecreaseResponse,
} from '../../services/assetmovement/types';
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

export interface ChannelAssetDetailContentProps {
  open: boolean;
  selectedRecord?: ChannelAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  channelMap: Map<string, NavigationChannelResponse>;
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

export default function ChannelAssetDetailContent({
  open,
  selectedRecord: rec,
  onClose,
  orgName,
  channelMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: ChannelAssetDetailContentProps) {
  const attachments = useMemo<InfrastructureAttachmentItem[]>(() => {
    if (!rec?.attachmentName) return [];
    return rec.attachmentName.split(',').map((name, i) => ({
      id: `att-${i}`,
      fileName: name.trim(),
      fileSize: 1024 * 512,
      uploadedByName:
        rec.updatedByName ||
        rec.submittedByName ||
        'Cán bộ quản lý',
      uploadedDate: rec.updatedAt
        ? dayjs(rec.updatedAt).toISOString()
        : dayjs().toISOString(),
    }));
  }, [rec]);

  const viewTabs = useMemo<ViewTabConfig[]>(() => {
    if (!rec) return [];

    const channelDisplay = (() => {
      if (rec.navigationChannelId && channelMap.has(rec.navigationChannelId)) {
        const c = channelMap.get(rec.navigationChannelId)!;
        return `[Luồng] ${c.channelCode ? `${c.channelCode} - ` : ''}${c.channelName}`;
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
                name: 'channelDisplay',
                label: 'Mã luồng hàng hải',
                render: () => (
                  <span style={{ fontWeight: fontWeightBold, color: actionPrimary }}>
                    {channelDisplay}
                  </span>
                ),
              },
              {
                name: 'assetType',
                label: 'Loại tài sản',
                render: () => 'Tài sản luồng hàng hải',
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
        label: `Hồ sơ tài sản (${attachments.length})`,
        customContent: () => (
          <div style={{ paddingTop: 6 }}>
            <InfrastructureAttachmentTab
              attachments={attachments}
              readonly={true}
              onUpload={() => {}}
              onDelete={() => {}}
              onDownload={(_id, fileName) => {
                alert(`Tải tệp tin: ${fileName}`);
              }}
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
            title: 'Thông tin giá trị & Khấu hao',
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
                render: (v) => (v != null ? `${v}%` : '—'),
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
                        <span style={{ color: textTertiary }}>Số lượng: </span>
                        <span>
                          {item.quantity != null
                            ? `${fmtNum(item.quantity)} ${item.unitOfMeasure || ''}`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>Thời hạn: </span>
                        <span>
                          {item.exploitationDeadline
                            ? dayjs(item.exploitationDeadline).format('DD/MM/YYYY')
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>
                          Tổng số tiền thu được:{' '}
                        </span>
                        <span style={{ fontWeight: fontWeightBold, color: actionPrimary }}>
                          {item.totalRevenue != null
                            ? `${fmtNum(item.totalRevenue)} VNĐ`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>Chi phí liên quan: </span>
                        <span>
                          {item.relatedCosts != null
                            ? `${fmtNum(item.relatedCosts)} VNĐ`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>Nộp NSNN: </span>
                        <span>
                          {item.stateBudgetPayment != null
                            ? `${fmtNum(item.stateBudgetPayment)} VNĐ`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: textTertiary }}>Tiền thực hiện DA: </span>
                        <span>
                          {item.projectAmount != null
                            ? `${fmtNum(item.projectAmount)} VNĐ`
                            : '—'}
                        </span>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: textTertiary }}>Ghi chú: </span>
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
        key: 'history',
        label: `Lịch sử thay đổi nguyên giá (${increaseRows.length + decreaseRows.length})`,
        customContent: () => {
          const totalHistory = increaseRows.length + decreaseRows.length;
          return (
            <div style={{ paddingTop: 6 }}>
              {totalHistory === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 0',
                    color: textTertiary,
                  }}
                >
                  Chưa có lịch sử thay đổi nguyên giá
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {increaseRows.map((item, index) => {
                    const d = item.adjustmentDetails;
                    return (
                      <div
                        key={`inc-${item.id || index}`}
                        style={{
                          ...sectionBoxStyle,
                          borderLeft: `4px solid ${statusOperational}`,
                        }}
                      >
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <PlusCircleOutlined
                              style={{ color: statusOperational }}
                            />
                            <span>Tăng nguyên giá — {item.increaseCode || item.reason || 'Điều chỉnh'}</span>
                          </div>
                          <span
                            style={{
                              color: statusOperational,
                              fontWeight: fontWeightBold,
                            }}
                          >
                            +{fmtNum(item.quantity || 0)} VNĐ
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
                            <span style={{ color: textTertiary }}>Số QĐ: </span>
                            <span>{d?.decisionNumber || '—'}</span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>Ngày QĐ: </span>
                            <span>
                              {d?.decisionDate
                                ? dayjs(d.decisionDate).format('DD/MM/YYYY')
                                : '—'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>Ngày tăng: </span>
                            <span>
                              {d?.adjustmentDate
                                ? dayjs(d.adjustmentDate).format('DD/MM/YYYY')
                                : '—'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>Lý do: </span>
                            <span>{d?.adjustmentReason || item.reason || '—'}</span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>
                              Nguyên giá trước/sau:{' '}
                            </span>
                            <span>
                              {d?.originalValueBefore != null
                                ? fmtNum(d.originalValueBefore)
                                : '—'}{' '}
                              →{' '}
                              {d?.originalValueAfter != null
                                ? fmtNum(d.originalValueAfter)
                                : '—'}{' '}
                              VNĐ
                            </span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>
                              Giá trị còn lại trước/sau:{' '}
                            </span>
                            <span>
                              {d?.remainingValueBefore != null
                                ? fmtNum(d.remainingValueBefore)
                                : '—'}{' '}
                              →{' '}
                              {d?.remainingValueAfter != null
                                ? fmtNum(d.remainingValueAfter)
                                : '—'}{' '}
                              VNĐ
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {decreaseRows.map((item, index) => {
                    const d = item.adjustmentDetails;
                    return (
                      <div
                        key={`dec-${item.id || index}`}
                        style={{
                          ...sectionBoxStyle,
                          borderLeft: `4px solid ${statusCritical}`,
                        }}
                      >
                        <div style={sectionHeaderStyle}>
                          <div style={sectionTitleStyle}>
                            <MinusCircleOutlined
                              style={{ color: statusCritical }}
                            />
                            <span>Giảm nguyên giá — {item.decreaseReason || item.reason || 'Điều chỉnh'}</span>
                          </div>
                          <span
                            style={{
                              color: statusCritical,
                              fontWeight: fontWeightBold,
                            }}
                          >
                            -{fmtNum(item.quantity || 0)} VNĐ
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
                            <span style={{ color: textTertiary }}>Số QĐ: </span>
                            <span>{d?.decisionNumber || '—'}</span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>Ngày QĐ: </span>
                            <span>
                              {d?.decisionDate
                                ? dayjs(d.decisionDate).format('DD/MM/YYYY')
                                : '—'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>Ngày giảm: </span>
                            <span>
                              {d?.adjustmentDate
                                ? dayjs(d.adjustmentDate).format('DD/MM/YYYY')
                                : '—'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>Lý do: </span>
                            <span>{d?.adjustmentReason || item.reason || '—'}</span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>
                              Nguyên giá trước/sau:{' '}
                            </span>
                            <span>
                              {d?.originalValueBefore != null
                                ? fmtNum(d.originalValueBefore)
                                : '—'}{' '}
                              →{' '}
                              {d?.originalValueAfter != null
                                ? fmtNum(d.originalValueAfter)
                                : '—'}{' '}
                              VNĐ
                            </span>
                          </div>
                          <div>
                            <span style={{ color: textTertiary }}>
                              Giá trị còn lại trước/sau:{' '}
                            </span>
                            <span>
                              {d?.remainingValueBefore != null
                                ? fmtNum(d.remainingValueBefore)
                                : '—'}{' '}
                              →{' '}
                              {d?.remainingValueAfter != null
                                ? fmtNum(d.remainingValueAfter)
                                : '—'}{' '}
                              VNĐ
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            title: 'Trạng thái & Thông tin phê duyệt',
            icon: <AuditOutlined />,
            fields: [
              {
                name: 'approvalStatus',
                label: 'Trạng thái phê duyệt',
                render: (v) => {
                  const s = APPROVAL_MAP[String(v || 'DRAFT').toUpperCase()] || {
                    color: textTertiary,
                    label: String(v || '—'),
                  };
                  return (
                    <span
                      style={{
                        padding: '3px 12px',
                        borderRadius: 999,
                        background: `${s.color}15`,
                        border: `1px solid ${s.color}40`,
                        color: s.color,
                        fontWeight: 600,
                        fontSize: 12.5,
                      }}
                    >
                      {s.label}
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
                label: 'Cán bộ duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Text,
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung duyệt cấp Cảng vụ',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ duyệt cấp Cục',
                type: ViewFieldType.Text,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày duyệt cấp Cục',
                type: ViewFieldType.DateTime,
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung duyệt cấp Cục',
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
    channelMap,
    orgName,
    attachments,
    exploitationRows,
    increaseRows,
    decreaseRows,
  ]);

  return (
    <DynamicViewSidebar
      open={open}
      onClose={onClose}
      record={rec}
      title={`Chi tiết tài sản${rec ? ` — ${rec.assetName}` : ''}`}
      tabs={viewTabs}
      width={typeof window !== 'undefined' ? Math.min(1000, Math.floor(window.innerWidth * 0.95)) : 1000}
    />
  );
}
