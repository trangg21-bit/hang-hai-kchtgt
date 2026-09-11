import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BankOutlined,
  SlidersOutlined,
  AuditOutlined,
  RocketOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RadarStationAsset } from '../../services/radarasset/types';
import type {
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
import {
  getOrGenerateAttachmentBlob,
  getAttachmentPreviewUrl,
  downloadAttachmentFile,
} from '../../utils/attachmentStorage';

export interface RadarStationAssetDetailContentProps {
  open: boolean;
  selectedRecord?: RadarStationAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  radarStationMap: Map<string, { code: string; name: string }>;
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
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ phê duyệt cấp Cục' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: {
    color: statusCritical,
    label: 'Từ chối cấp Cảng vụ/Chi cục',
  },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Từ chối cấp Cục' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
};

const fmtDateTime = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY HH:mm:ss') : '—';
const fmtDate = (v?: string | null): string =>
  v ? dayjs(v).format('DD/MM/YYYY') : '—';

export default function RadarStationAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  radarStationMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
}: RadarStationAssetDetailContentProps) {
  const [attachments, setAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  useEffect(() => {
    if (!selectedRecord?.attachmentName) {
      setAttachments([]);
      return;
    }
    const names = selectedRecord.attachmentName
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    let isMounted = true;

    const initialItems: InfrastructureAttachmentItem[] = names.map((name, i) => ({
      id: `att-${i + 1}`,
      fileName: name,
      fileSize: 1024 * 1024,
      uploadedAt: selectedRecord.createdAt,
      uploadedByName: selectedRecord.createdByName || 'Cán bộ cập nhật',
    }));
    setAttachments(initialItems);

    Promise.all(
      names.map(async (name, i) => {
        try {
          const url = await getAttachmentPreviewUrl(name, {
            assetCode: selectedRecord.assetCode,
            assetName: selectedRecord.assetName,
          });
          return { id: `att-${i + 1}`, url };
        } catch {
          return { id: `att-${i + 1}`, url: undefined };
        }
      })
    ).then((resolved) => {
      if (!isMounted) return;
      setAttachments((prev) =>
        prev.map((item) => {
          const match = resolved.find((r) => r.id === item.id);
          return match?.url ? { ...item, url: match.url } : item;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, [selectedRecord]);

  const handleLoadReadonlyPreviewImage = useCallback(
    async (attachmentId: string) => {
      const att = attachments.find((item) => item.id === attachmentId);
      if (!att) throw new Error('Không tìm thấy tệp');
      return await getOrGenerateAttachmentBlob(att.fileName, {
        assetCode: selectedRecord?.assetCode,
        assetName: selectedRecord?.assetName,
      });
    },
    [attachments, selectedRecord?.assetCode, selectedRecord?.assetName]
  );

  const handleDownloadAttachment = useCallback(
    async (_id: string, fileName?: string) => {
      if (!fileName) return;
      await downloadAttachmentFile(fileName, {
        assetCode: selectedRecord?.assetCode,
        assetName: selectedRecord?.assetName,
      });
    },
    [selectedRecord?.assetCode, selectedRecord?.assetName]
  );

  const tabs = useMemo<ViewTabConfig<RadarStationAsset>[]>(() => {
    if (!selectedRecord) return [];

    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        icon: <BankOutlined />,
        sections: [
          {
            key: 'org_info',
            title: 'Cơ quan & Tổ chức quản lý',
            fields: [
              {
                name: 'parentOrgUnitId',
                label: 'Cơ quan quản lý cấp trên',
                type: ViewFieldType.Text,
                valueFormatter: (val) =>
                  (val && orgName.get(String(val))) || selectedRecord.parentOrgUnitName || '—',
                colSpan: 12,
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: ViewFieldType.Text,
                valueFormatter: (val) =>
                  (val && orgName.get(String(val))) || selectedRecord.orgUnitName || '—',
                colSpan: 12,
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: ViewFieldType.Text,
                valueFormatter: (val) =>
                  (val && orgName.get(String(val))) || selectedRecord.usingOrgUnitName || '—',
                colSpan: 12,
              },
              {
                name: 'radarStationId',
                label: 'Mã trạm radar',
                type: ViewFieldType.Text,
                valueFormatter: (val) => {
                  const r = val ? radarStationMap.get(String(val)) : undefined;
                  return r ? `${r.code} - ${r.name}` : selectedRecord.radarStationCode || '—';
                },
                colSpan: 12,
              },
            ],
          },
          {
            key: 'asset_basic',
            title: 'Thông tin tài sản',
            fields: [
              {
                name: 'assetType',
                label: 'Loại tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetCode',
                label: 'Mã tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetName',
                label: 'Tên tài sản',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
              {
                name: 'barcode',
                label: 'Barcode',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetCondition',
                label: 'Tình trạng tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'usageStatus',
                label: 'Hiện trạng sử dụng',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetGroup',
                label: 'Nhóm tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assetSubgroup',
                label: 'Phân nhóm tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'origin',
                label: 'Nguồn gốc',
                type: ViewFieldType.Text,
                colSpan: 12,
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
            key: 'tech_specs',
            title: 'Chỉ số tổng hợp & Quy mô kỹ thuật',
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: ViewFieldType.Number,
                valueFormatter: (val) => fmtNum(val),
                colSpan: 12,
              },
              {
                name: 'quantityUnit',
                label: 'Đơn vị tính số lượng',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'model',
                label: 'Model',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'serialNumber',
                label: 'Serial',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'countryOfOrigin',
                label: 'Xuất xứ',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'manufacturer',
                label: 'Hãng sản xuất',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'constructionYear',
                label: 'Năm xây dựng',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'useDate',
                label: 'Ngày sử dụng tài sản',
                type: ViewFieldType.Text,
                valueFormatter: (val) => fmtDate(val as string),
                colSpan: 12,
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m²)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => fmtNum(val),
                colSpan: 12,
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m²)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => fmtNum(val),
                colSpan: 12,
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
        key: 'attachments',
        label: `Hồ sơ tài sản (${attachments.length})`,
        icon: <ProfileOutlined />,
        customContent: (
          <div style={{ padding: '8px 0' }}>
            <InfrastructureAttachmentTab
              refType="RADAR_STATION_ASSET"
              refId={selectedRecord.id}
              attachments={attachments}
              readonly
              onDownload={handleDownloadAttachment}
              loadReadonlyPreviewImage={handleLoadReadonlyPreviewImage}
            />
          </div>
        ),
        customRender: () => (
          <div style={{ padding: '8px 0' }}>
            <InfrastructureAttachmentTab
              refType="RADAR_STATION_ASSET"
              refId={selectedRecord.id}
              attachments={attachments}
              readonly
              onDownload={handleDownloadAttachment}
              loadReadonlyPreviewImage={handleLoadReadonlyPreviewImage}
            />
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Thông tin chi tiết',
        icon: <SlidersOutlined />,
        sections: [
          {
            key: 'financial_info',
            title: 'Thông tin giá trị & Khấu hao tài sản',
            fields: [
              {
                name: 'declarationDate',
                label: 'Ngày kê khai tài sản',
                type: ViewFieldType.Text,
                valueFormatter: (val) => fmtDate(val as string),
                colSpan: 12,
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => `${fmtNum(val)} VNĐ`,
                colSpan: 12,
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => (val != null ? `${val}%` : '—'),
                colSpan: 12,
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => `${fmtNum(val)} VNĐ`,
                colSpan: 12,
              },
              {
                name: 'valueUnit',
                label: 'Đơn vị tính giá trị',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: ViewFieldType.Text,
                valueFormatter: (val) => fmtDate(val as string),
                colSpan: 12,
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Text,
                valueFormatter: (val) => fmtDate(val as string),
                colSpan: 12,
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => `${fmtNum(val)} VNĐ`,
                colSpan: 12,
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: ViewFieldType.Number,
                valueFormatter: (val) => `${fmtNum(val)} VNĐ`,
                colSpan: 12,
              },
              {
                name: 'disposalMethod',
                label: 'Hình thức xử lý tài sản',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
            ],
          },
        ],
      },
      {
        key: 'exploitation',
        label: 'Khai thác tài sản',
        icon: <RocketOutlined />,
        customRender: () => (
          <div style={{ padding: '8px 0' }}>
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <RocketOutlined style={{ color: actionPrimary }} />
                  <span>Danh sách hồ sơ khai thác tài sản</span>
                </div>
              </div>
              {exploitationRows.length === 0 ? (
                <div
                  style={{
                    padding: '24px 0',
                    textAlign: 'center',
                    color: textTertiary,
                    fontSize: fontSizeMd,
                  }}
                >
                  Chưa có hồ sơ khai thác nào được ghi nhận cho tài sản này
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {exploitationRows.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Đơn vị khai thác</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {row.operatorOrgUnitId
                            ? orgName.get(row.operatorOrgUnitId) || row.operatorOrgUnitId
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Thời hạn khai thác</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {fmtDate(row.exploitationDeadline)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Tổng thu (VNĐ)</div>
                        <div style={{ fontWeight: fontWeightBold, color: statusOperational }}>
                          {fmtNum(row.totalRevenue || row.doanhThu)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Nộp NSNN (VNĐ)</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {fmtNum(row.stateBudgetPayment)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'adjustments',
        label: 'Lịch sử thay đổi nguyên giá',
        icon: <AuditOutlined />,
        customRender: () => (
          <div style={{ padding: '8px 0' }}>
            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <PlusCircleOutlined style={{ color: statusOperational }} />
                  <span>Lịch sử tăng nguyên giá</span>
                </div>
              </div>
              {increaseRows.length === 0 ? (
                <div
                  style={{
                    padding: '16px 0',
                    textAlign: 'center',
                    color: textTertiary,
                    fontSize: fontSizeMd,
                  }}
                >
                  Chưa có thông tin tăng nguyên giá
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {increaseRows.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Mã yêu cầu / Số QĐ</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {row.increaseCode || row.adjustmentDetails?.decisionNumber || '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Ngày quyết định</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {fmtDate(row.adjustmentDetails?.decisionDate)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Nguyên giá sau tăng</div>
                        <div style={{ fontWeight: fontWeightBold, color: statusOperational }}>
                          {fmtNum(row.adjustmentDetails?.originalValueAfter)} VNĐ
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Trạng thái</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {APPROVAL_MAP[row.approvalStatus]?.label || row.approvalStatus}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={sectionBoxStyle}>
              <div style={sectionHeaderStyle}>
                <div style={sectionTitleStyle}>
                  <MinusCircleOutlined style={{ color: statusCritical }} />
                  <span>Lịch sử giảm nguyên giá</span>
                </div>
              </div>
              {decreaseRows.length === 0 ? (
                <div
                  style={{
                    padding: '16px 0',
                    textAlign: 'center',
                    color: textTertiary,
                    fontSize: fontSizeMd,
                  }}
                >
                  Chưa có thông tin giảm nguyên giá
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {decreaseRows.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Mã yêu cầu / Số QĐ</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {row.decreaseCode || row.adjustmentDetails?.decisionNumber || '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Ngày quyết định</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {fmtDate(row.adjustmentDetails?.decisionDate)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Nguyên giá sau giảm</div>
                        <div style={{ fontWeight: fontWeightBold, color: statusCritical }}>
                          {fmtNum(row.adjustmentDetails?.originalValueAfter)} VNĐ
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: textTertiary }}>Trạng thái</div>
                        <div style={{ fontWeight: fontWeightBold }}>
                          {APPROVAL_MAP[row.approvalStatus]?.label || row.approvalStatus}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'approval',
        label: 'Xử lý & theo dõi',
        icon: <AuditOutlined />,
        sections: [
          {
            key: 'status_info',
            title: 'Trạng thái & Thông tin cập nhật',
            fields: [
              {
                name: 'approvalStatus',
                label: 'Trạng thái',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => {
                  const statusInfo = APPROVAL_MAP[v as string] || {
                    color: textTertiary,
                    label: (v as string) || '—',
                  };
                  return (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 500,
                        background: `${statusInfo.color}15`,
                        border: `1px solid ${statusInfo.color}40`,
                        color: statusInfo.color,
                      }}
                    >
                      {statusInfo.label}
                    </span>
                  );
                },
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (val) => (
                  <span style={{ fontWeight: fontWeightBold }}>
                    {String(val || '—')}
                  </span>
                ),
              },
              {
                name: 'updatedAt',
                label: 'Ngày cập nhật',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
            ],
          },
          {
            key: 'submission_info',
            title: 'Thông tin gửi phê duyệt',
            fields: [
              {
                name: 'submittedByName',
                label: 'Cán bộ gửi phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'submittedAt',
                label: 'Ngày gửi phê duyệt',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
            ],
          },
          {
            key: 'port_approval',
            title: 'Phê duyệt cấp Cảng vụ/Chi cục',
            fields: [
              {
                name: 'portAuthorityApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt cấp Cảng vụ/Chi cục',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
          {
            key: 'department_approval',
            title: 'Phê duyệt cấp Cục',
            fields: [
              {
                name: 'departmentApprovedByName',
                label: 'Cán bộ phê duyệt cấp Cục',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt cấp Cục',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
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
    attachments,
    decreaseRows,
    exploitationRows,
    increaseRows,
    orgName,
    radarStationMap,
    selectedRecord,
    handleDownloadAttachment,
    handleLoadReadonlyPreviewImage,
  ]);

  return (
    <DynamicViewSidebar<RadarStationAsset>
      open={open}
      title={
        <span
          style={{
            fontSize: 16,
            fontWeight: fontWeightBold,
            color: colors.sidebarBg,
          }}
        >
          Chi tiết tài sản trạm radar — {selectedRecord?.assetName || ''}
        </span>
      }
      record={selectedRecord}
      data={selectedRecord}
      tabs={tabs}
      onClose={onClose}
      width="90vw"
      rootClassName="radar-asset-drawer-scope"
    />
  );
}
