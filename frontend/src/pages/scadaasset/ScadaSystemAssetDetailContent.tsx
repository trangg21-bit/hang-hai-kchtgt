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
import type { ScadaSystemAsset } from '../../services/scadaasset/types';
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

export interface ScadaSystemAssetDetailContentProps {
  open: boolean;
  selectedRecord?: ScadaSystemAsset;
  onClose: () => void;
  orgName: Map<string, string>;
  scadaDeviceMap: Map<string, { deviceCode: string; deviceName: string }>;
  exploitationRows: AssetExploitationResponse[];
  increaseRows: AssetIncreaseResponse[];
  decreaseRows: AssetDecreaseResponse[];
  attachments?: InfrastructureAttachmentItem[];
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

export default function ScadaSystemAssetDetailContent({
  open,
  selectedRecord,
  onClose,
  orgName,
  scadaDeviceMap,
  exploitationRows,
  increaseRows,
  decreaseRows,
  attachments,
}: ScadaSystemAssetDetailContentProps) {
  const [detailAttachments, setDetailAttachments] = useState<InfrastructureAttachmentItem[]>([]);

  useEffect(() => {
    let initialList: InfrastructureAttachmentItem[] = [];
    if (attachments && attachments.length > 0) {
      initialList = attachments;
    } else if (selectedRecord?.attachmentName && selectedRecord.attachmentName.trim()) {
      initialList = selectedRecord.attachmentName
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name, i) => ({
          id: `scada-att-${selectedRecord.id}-${i + 1}`,
          fileName: name,
          fileSize: 1024 * 1024 * (i + 1),
          uploadedAt: selectedRecord.updatedAt || selectedRecord.createdAt,
          uploadedByName:
            selectedRecord.updatedByName ||
            selectedRecord.submittedByName ||
            'Cán bộ cập nhật',
        }));
    } else {
      initialList = [
        {
          id: 'scada-sample-att-1',
          fileName: 'Quyet_dinh_dau_tu_he_thong_scada.pdf',
          fileSize: 2450000,
          uploadedAt: selectedRecord?.createdAt || new Date().toISOString(),
          uploadedByName: selectedRecord?.updatedByName || 'Cán bộ quản lý',
        },
        {
          id: 'scada-sample-att-2',
          fileName: 'Bien_ban_kiem_dinh_thiet_bi_scada.pdf',
          fileSize: 1820000,
          uploadedAt: selectedRecord?.createdAt || new Date().toISOString(),
          uploadedByName: selectedRecord?.updatedByName || 'Cán bộ quản lý',
        },
        {
          id: 'scada-sample-att-3',
          fileName: 'So_do_lap_dat_scada.png',
          fileSize: 3100000,
          uploadedAt: selectedRecord?.createdAt || new Date().toISOString(),
          uploadedByName: selectedRecord?.updatedByName || 'Cán bộ quản lý',
        },
      ];
    }
    setDetailAttachments(initialList);

    let isMounted = true;
    Promise.all(
      initialList.map(async (item) => {
        try {
          const url = await getAttachmentPreviewUrl(item.fileName, {
            assetCode: selectedRecord?.assetCode,
            assetName: selectedRecord?.assetName,
          });
          return { id: item.id, url };
        } catch {
          return { id: item.id, url: undefined };
        }
      })
    ).then((resolved) => {
      if (!isMounted) return;
      setDetailAttachments((prev) =>
        prev.map((item) => {
          const match = resolved.find((r) => r.id === item.id);
          return match?.url ? { ...item, url: match.url } : item;
        })
      );
    });

    return () => {
      isMounted = false;
    };
  }, [attachments, selectedRecord]);

  const handleLoadReadonlyPreviewImage = useCallback(
    async (attachmentId: string) => {
      const att = detailAttachments.find((item) => item.id === attachmentId);
      if (!att) throw new Error('Không tìm thấy tệp');
      return await getOrGenerateAttachmentBlob(att.fileName, {
        assetCode: selectedRecord?.assetCode,
        assetName: selectedRecord?.assetName,
      });
    },
    [detailAttachments, selectedRecord?.assetCode, selectedRecord?.assetName]
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

  const tabs = useMemo<ViewTabConfig<ScadaSystemAsset>[]>(() => {
    if (!selectedRecord) return [];

    const scadaInfo = selectedRecord.scadaId
      ? scadaDeviceMap.get(selectedRecord.scadaId)
      : undefined;
    const scadaDisplay = scadaInfo
      ? `${scadaInfo.deviceCode} - ${scadaInfo.deviceName}`
      : selectedRecord.scadaCode
      ? `${selectedRecord.scadaCode} - ${selectedRecord.scadaName || ''}`
      : '—';

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
                colSpan: 12,
                render: (v) =>
                  selectedRecord.parentOrgUnitName ||
                  (v ? orgName.get(v as string) : undefined) ||
                  '—',
              },
              {
                name: 'orgUnitId',
                label: 'Đơn vị quản lý',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) =>
                  selectedRecord.orgUnitName ||
                  (v ? orgName.get(v as string) : undefined) ||
                  '—',
              },
              {
                name: 'usingOrgUnitId',
                label: 'Đơn vị sử dụng',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) =>
                  selectedRecord.usingOrgUnitName ||
                  (v ? orgName.get(v as string) : undefined) ||
                  '—',
              },
              {
                name: 'scadaId',
                label: 'Mã thiết bị',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: () => scadaDisplay,
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
            key: 'composite_indexes',
            title: 'Chỉ số tổng hợp',
            fields: [
              {
                name: 'quantity',
                label: 'Số lượng',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) =>
                  v != null
                    ? `${fmtNum(v as number)} ${selectedRecord.quantityUnit || ''}`
                    : '—',
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
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDate(v as string),
              },
              {
                name: 'landArea',
                label: 'Diện tích (đất, sàn sử dụng: m²)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'floorArea',
                label: 'Diện tích (sàn sử dụng: m²)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
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
        label: `Hồ sơ tài sản (${detailAttachments.length})`,
        icon: <ProfileOutlined />,
        customContent: (
          <div style={{ padding: '8px 0' }}>
            <InfrastructureAttachmentTab
              refType="SCADA_SYSTEM_ASSET"
              refId={selectedRecord.id}
              attachments={detailAttachments}
              readonly
              onDownload={handleDownloadAttachment}
              loadReadonlyPreviewImage={handleLoadReadonlyPreviewImage}
            />
          </div>
        ),
        customRender: () => (
          <div style={{ padding: '8px 0' }}>
            <InfrastructureAttachmentTab
              refType="SCADA_SYSTEM_ASSET"
              refId={selectedRecord.id}
              attachments={detailAttachments}
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
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDate(v as string),
              },
              {
                name: 'originalValue',
                label: 'Nguyên giá (VNĐ)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'depreciationRate',
                label: 'Tỷ lệ hao mòn/Khấu hao (%)',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => (v != null ? `${v}%` : '—'),
              },
              {
                name: 'remainingValue',
                label: 'Giá trị còn lại (VNĐ)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'valueUnit',
                label: 'Đơn vị tính giá trị',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => (v as string) || 'VNĐ',
              },
              {
                name: 'assignmentDecisionNumber',
                label: 'Số quyết định giao (bao gồm cả tăng vốn)',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'depreciationStartDate',
                label: 'Ngày tính khấu hao',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDate(v as string),
              },
              {
                name: 'depreciationMonths',
                label: 'Số tháng tính khấu hao',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => (v != null ? `${v} tháng` : '—'),
              },
              {
                name: 'depreciationEndDate',
                label: 'Ngày hết khấu hao',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDate(v as string),
              },
              {
                name: 'accumulatedDepreciation',
                label: 'Khấu hao lũy kế (VNĐ)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
              },
              {
                name: 'monthlyDepreciation',
                label: 'Khấu hao tháng (VNĐ)',
                type: ViewFieldType.Number,
                colSpan: 12,
                formatter: (v) => fmtNum(v as number),
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
        label: `Khai thác tài sản (${exploitationRows.length})`,
        icon: <RocketOutlined />,
        customContent: (
          <div style={{ padding: '8px 0' }}>
            {exploitationRows.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: textTertiary }}>
                Chưa có hồ sơ khai thác tài sản
              </div>
            ) : (
              exploitationRows.map((r) => (
                <div key={r.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <span style={sectionTitleStyle}>
                      <RocketOutlined style={{ color: actionPrimary }} />
                      Năm khai thác: {r.exploitationYear || '—'}
                    </span>
                    <span style={{ fontSize: 12, color: textTertiary }}>
                      Cập nhật: {fmtDateTime(r.updatedAt || r.createdAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px 16px',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>Đơn vị khai thác:</strong>{' '}
                      {r.operatorOrgUnitId ? orgName.get(r.operatorOrgUnitId) || '—' : '—'}
                    </div>
                    <div>
                      <strong>Thời hạn khai thác:</strong>{' '}
                      {fmtDate(r.exploitationDeadline)}
                    </div>
                    <div>
                      <strong>Số lượng:</strong> {r.quantity != null ? fmtNum(r.quantity) : '—'}{' '}
                      {r.unitOfMeasure || ''}
                    </div>
                    <div>
                      <strong>Tổng số tiền thu được:</strong>{' '}
                      {fmtNum(r.totalRevenue || r.doanhThu)} VNĐ
                    </div>
                    <div>
                      <strong>Chi phí có liên quan:</strong>{' '}
                      {fmtNum(r.relatedCosts || r.depreciation)} VNĐ
                    </div>
                    <div>
                      <strong>Nộp NSNN:</strong> {fmtNum(r.stateBudgetPayment)} VNĐ
                    </div>
                    <div>
                      <strong>Số tiền thực hiện dự án:</strong> {fmtNum(r.projectAmount)} VNĐ
                    </div>
                    <div>
                      <strong>Ghi chú:</strong> {r.notes || r.description || '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ),
        customRender: () => (
          <div style={{ padding: '8px 0' }}>
            {exploitationRows.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: textTertiary }}>
                Chưa có hồ sơ khai thác tài sản
              </div>
            ) : (
              exploitationRows.map((r) => (
                <div key={r.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <span style={sectionTitleStyle}>
                      <RocketOutlined style={{ color: actionPrimary }} />
                      Năm khai thác: {r.exploitationYear || '—'}
                    </span>
                    <span style={{ fontSize: 12, color: textTertiary }}>
                      Cập nhật: {fmtDateTime(r.updatedAt || r.createdAt)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px 16px',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>Đơn vị khai thác:</strong>{' '}
                      {r.operatorOrgUnitId ? orgName.get(r.operatorOrgUnitId) || '—' : '—'}
                    </div>
                    <div>
                      <strong>Thời hạn khai thác:</strong>{' '}
                      {fmtDate(r.exploitationDeadline)}
                    </div>
                    <div>
                      <strong>Số lượng:</strong> {r.quantity != null ? fmtNum(r.quantity) : '—'}{' '}
                      {r.unitOfMeasure || ''}
                    </div>
                    <div>
                      <strong>Tổng số tiền thu được:</strong>{' '}
                      {fmtNum(r.totalRevenue || r.doanhThu)} VNĐ
                    </div>
                    <div>
                      <strong>Chi phí có liên quan:</strong>{' '}
                      {fmtNum(r.relatedCosts || r.depreciation)} VNĐ
                    </div>
                    <div>
                      <strong>Nộp NSNN:</strong> {fmtNum(r.stateBudgetPayment)} VNĐ
                    </div>
                    <div>
                      <strong>Số tiền thực hiện dự án:</strong> {fmtNum(r.projectAmount)} VNĐ
                    </div>
                    <div>
                      <strong>Ghi chú:</strong> {r.notes || r.description || '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ),
      },
      {
        key: 'value_changes',
        label: `Thay đổi nguyên giá (${increaseRows.length + decreaseRows.length})`,
        icon: <PlusCircleOutlined />,
        customContent: (
          <div style={{ padding: '8px 0' }}>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: statusOperational,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
              }}
            >
              <PlusCircleOutlined /> Lịch sử tăng nguyên giá ({increaseRows.length})
            </h4>
            {increaseRows.length === 0 ? (
              <div style={{ padding: '8px 0 16px 0', color: textTertiary }}>
                Chưa có yêu cầu tăng nguyên giá
              </div>
            ) : (
              increaseRows.map((r) => (
                <div key={r.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <span style={sectionTitleStyle}>
                      <PlusCircleOutlined style={{ color: statusOperational }} />
                      Mã yêu cầu: {r.increaseCode} — Lý do: {r.reason}
                    </span>
                    <span style={{ fontSize: 12, color: textTertiary }}>
                      Trạng thái: {APPROVAL_MAP[r.approvalStatus]?.label || r.approvalStatus}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px 16px',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>Số QĐ:</strong> {r.adjustmentDetails?.decisionNumber || '—'}
                    </div>
                    <div>
                      <strong>Ngày QĐ:</strong>{' '}
                      {fmtDate(r.adjustmentDetails?.decisionDate)}
                    </div>
                    <div>
                      <strong>Ngày tăng:</strong>{' '}
                      {fmtDate(r.adjustmentDetails?.adjustmentDate)}
                    </div>
                    <div>
                      <strong>Nguyên giá trước:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.originalValueBefore)} VNĐ
                    </div>
                    <div>
                      <strong>Nguyên giá sau:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.originalValueAfter)} VNĐ
                    </div>
                    <div>
                      <strong>Giá trị còn lại sau:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.remainingValueAfter)} VNĐ
                    </div>
                  </div>
                </div>
              ))
            )}

            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: statusCritical,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 16,
                marginBottom: 10,
              }}
            >
              <MinusCircleOutlined /> Lịch sử giảm nguyên giá ({decreaseRows.length})
            </h4>
            {decreaseRows.length === 0 ? (
              <div style={{ padding: '8px 0 16px 0', color: textTertiary }}>
                Chưa có yêu cầu giảm nguyên giá
              </div>
            ) : (
              decreaseRows.map((r) => (
                <div key={r.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <span style={sectionTitleStyle}>
                      <MinusCircleOutlined style={{ color: statusCritical }} />
                      Mã yêu cầu: {r.decreaseCode} — Lý do: {r.reason}
                    </span>
                    <span style={{ fontSize: 12, color: textTertiary }}>
                      Trạng thái: {APPROVAL_MAP[r.approvalStatus]?.label || r.approvalStatus}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px 16px',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>Số QĐ:</strong> {r.adjustmentDetails?.decisionNumber || '—'}
                    </div>
                    <div>
                      <strong>Ngày QĐ:</strong>{' '}
                      {fmtDate(r.adjustmentDetails?.decisionDate)}
                    </div>
                    <div>
                      <strong>Ngày giảm:</strong>{' '}
                      {fmtDate(r.adjustmentDetails?.adjustmentDate)}
                    </div>
                    <div>
                      <strong>Nguyên giá trước:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.originalValueBefore)} VNĐ
                    </div>
                    <div>
                      <strong>Nguyên giá sau:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.originalValueAfter)} VNĐ
                    </div>
                    <div>
                      <strong>Giá trị còn lại sau:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.remainingValueAfter)} VNĐ
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ),
        customRender: () => (
          <div style={{ padding: '8px 0' }}>
            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: statusOperational,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
              }}
            >
              <PlusCircleOutlined /> Lịch sử tăng nguyên giá ({increaseRows.length})
            </h4>
            {increaseRows.length === 0 ? (
              <div style={{ padding: '8px 0 16px 0', color: textTertiary }}>
                Chưa có yêu cầu tăng nguyên giá
              </div>
            ) : (
              increaseRows.map((r) => (
                <div key={r.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <span style={sectionTitleStyle}>
                      <PlusCircleOutlined style={{ color: statusOperational }} />
                      Mã yêu cầu: {r.increaseCode} — Lý do: {r.reason}
                    </span>
                    <span style={{ fontSize: 12, color: textTertiary }}>
                      Trạng thái: {APPROVAL_MAP[r.approvalStatus]?.label || r.approvalStatus}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px 16px',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>Số QĐ:</strong> {r.adjustmentDetails?.decisionNumber || '—'}
                    </div>
                    <div>
                      <strong>Ngày QĐ:</strong>{' '}
                      {fmtDate(r.adjustmentDetails?.decisionDate)}
                    </div>
                    <div>
                      <strong>Ngày tăng:</strong>{' '}
                      {fmtDate(r.adjustmentDetails?.adjustmentDate)}
                    </div>
                    <div>
                      <strong>Nguyên giá trước:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.originalValueBefore)} VNĐ
                    </div>
                    <div>
                      <strong>Nguyên giá sau:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.originalValueAfter)} VNĐ
                    </div>
                    <div>
                      <strong>Giá trị còn lại sau:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.remainingValueAfter)} VNĐ
                    </div>
                  </div>
                </div>
              ))
            )}

            <h4
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: statusCritical,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 16,
                marginBottom: 10,
              }}
            >
              <MinusCircleOutlined /> Lịch sử giảm nguyên giá ({decreaseRows.length})
            </h4>
            {decreaseRows.length === 0 ? (
              <div style={{ padding: '8px 0 16px 0', color: textTertiary }}>
                Chưa có yêu cầu giảm nguyên giá
              </div>
            ) : (
              decreaseRows.map((r) => (
                <div key={r.id} style={sectionBoxStyle}>
                  <div style={sectionHeaderStyle}>
                    <span style={sectionTitleStyle}>
                      <MinusCircleOutlined style={{ color: statusCritical }} />
                      Mã yêu cầu: {r.decreaseCode} — Lý do: {r.reason}
                    </span>
                    <span style={{ fontSize: 12, color: textTertiary }}>
                      Trạng thái: {APPROVAL_MAP[r.approvalStatus]?.label || r.approvalStatus}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px 16px',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>Số QĐ:</strong> {r.adjustmentDetails?.decisionNumber || '—'}
                    </div>
                    <div>
                      <strong>Ngày QĐ:</strong>{' '}
                      {fmtDate(r.adjustmentDetails?.decisionDate)}
                    </div>
                    <div>
                      <strong>Ngày giảm:</strong>{' '}
                      {fmtDate(r.adjustmentDetails?.adjustmentDate)}
                    </div>
                    <div>
                      <strong>Nguyên giá trước:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.originalValueBefore)} VNĐ
                    </div>
                    <div>
                      <strong>Nguyên giá sau:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.originalValueAfter)} VNĐ
                    </div>
                    <div>
                      <strong>Giá trị còn lại sau:</strong>{' '}
                      {fmtNum(r.adjustmentDetails?.remainingValueAfter)} VNĐ
                    </div>
                  </div>
                </div>
              ))
            )}
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
                label: 'Trạng thái phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => {
                  const statusInfo = APPROVAL_MAP[v as string] || {
                    color: textTertiary,
                    label: v || '—',
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
                name: 'status',
                label: 'Tình trạng vận hành',
                type: ViewFieldType.Text,
                colSpan: 12,
                render: (v) => (v === 'MANAGED' ? 'Đang quản lý' : (v as string) || '—'),
              },
              {
                name: 'updatedByName',
                label: 'Cán bộ cập nhật',
                type: ViewFieldType.Text,
                colSpan: 12,
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
                label: 'Cán bộ phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'portAuthorityApprovedAt',
                label: 'Ngày phê duyệt',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'portAuthorityApprovalContent',
                label: 'Nội dung phê duyệt',
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
                label: 'Cán bộ phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 12,
              },
              {
                name: 'departmentApprovedAt',
                label: 'Ngày phê duyệt',
                type: ViewFieldType.Date,
                colSpan: 12,
                render: (v) => fmtDateTime(v as string),
              },
              {
                name: 'departmentApprovalContent',
                label: 'Nội dung phê duyệt',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
              {
                name: 'rejectionReason',
                label: 'Lý do từ chối (nếu có)',
                type: ViewFieldType.Text,
                colSpan: 24,
              },
            ],
          },
        ],
      },
    ];
  }, [
    selectedRecord,
    orgName,
    scadaDeviceMap,
    exploitationRows,
    increaseRows,
    decreaseRows,
    detailAttachments,
    handleDownloadAttachment,
    handleLoadReadonlyPreviewImage,
  ]);

  return (
    <DynamicViewSidebar<ScadaSystemAsset>
      open={open}
      title={
        <span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: 16 }}>
          Chi tiết tài sản HT SCADA — {selectedRecord?.assetName || ''}
        </span>
      }
      record={selectedRecord}
      tabs={tabs}
      onClose={onClose}
      width={1000}
    />
  );
}
