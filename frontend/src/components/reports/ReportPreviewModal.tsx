import React, { useMemo } from 'react';
import { Modal, Table, Button, Space, Typography, Tag, Empty, Spin } from 'antd';
import {
  FileExcelOutlined,
  FileTextOutlined,
  CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ReportResponse } from '../../types/report';
import {
  statusOperational,
  textPrimary,
  fontWeightBold,
  radiusSm,
} from '../../tokens';
import { colors, layout } from '../../theme';

const { Title, Text } = Typography;

export interface ReportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  reportCode: string;
  reportName: string;
  orgUnitName: string;
  reportPeriodText: string;
  reportData: ReportResponse | null;
  loading: boolean;
  onExport: (format: 'EXCEL' | 'PDF') => void;
  loadingExport: 'EXCEL' | 'PDF' | null;
}

interface ReportColumnConfig {
  width: number;
  align: 'left' | 'center' | 'right';
}

function getReportColumnConfig(header: string): ReportColumnConfig {
  const h = header.toLowerCase().trim();

  let width = 160;
  let align: 'left' | 'center' | 'right' = 'left';

  if (h === 'stt') {
    return { width: 65, align: 'center' };
  }
  if (h.includes('đơn vị tính') || h === 'đvt') {
    width = 110;
    align = 'center';
  } else if (h.includes('mã')) {
    width = 130;
    align = 'center';
  } else if (h.includes('thời điểm') || h.includes('ngày') || h.includes('năm')) {
    width = 140;
    align = 'center';
  } else if (h.includes('chiều dài')) {
    width = 200;
    align = 'right';
  } else if (h.includes('tàu') || h.includes('dwt')) {
    width = 185;
    align = 'right';
  } else if (
    h.includes('năng lực') ||
    h.includes('gt') ||
    h.includes('công suất') ||
    h.includes('diện tích') ||
    h.includes('chi phí') ||
    h.includes('số lượng') ||
    h.includes('khối lượng') ||
    h.includes('tổng số') ||
    h.includes('sức chở') ||
    h.includes('mớn nước') ||
    h.includes('độ sâu') ||
    h.includes('dung tích') ||
    h.includes('trọng tải') ||
    h.includes('sản lượng')
  ) {
    width = 170;
    align = 'right';
  } else if (h.includes('danh mục') || h.includes('tên')) {
    width = 340;
    align = 'left';
  } else if (h.includes('đơn vị') || h.includes('khai thác') || h.includes('quản lý')) {
    width = 260;
    align = 'left';
  } else if (h.includes('địa điểm') || h.includes('vị trí') || h.includes('phạm vi')) {
    width = 220;
    align = 'left';
  } else if (h.includes('công năng') || h.includes('chức năng') || h.includes('loại')) {
    width = 220;
    align = 'left';
  } else if (h.includes('ghi chú')) {
    width = 150;
    align = 'left';
  }

  return { width, align };
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  open,
  onClose,
  reportCode,
  reportName,
  orgUnitName,
  reportPeriodText,
  reportData,
  loading,
  onExport,
  loadingExport,
}) => {
  const columns = useMemo(() => {
    if (!reportData || reportData.headers.length === 0) return [];
    return reportData.headers.map((h) => {
      const colConfig = getReportColumnConfig(h);
      return {
        title: (
          <div
            className="report-preview-th-content"
            style={{
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.35,
              textAlign: 'center',
              width: '100%',
              fontWeight: 700,
            }}
          >
            {h}
          </div>
        ),
        dataIndex: h,
        key: h,
        width: colConfig.width,
        align: colConfig.align,
        onHeaderCell: () => ({
          style: {
            background: colors.bodyBg,
            color: colors.sidebarBg,
            fontWeight: fontWeightBold,
            fontSize: 13,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: 1.35,
            textTransform: 'uppercase' as const,
            padding: '10px 12px',
            textAlign: 'center',
            verticalAlign: 'middle',
          },
        }),
        onCell: (record: Record<string, unknown>) => {
          const isBold =
            record._rowType === 'section' ||
            record._rowType === 'port' ||
            (record['STT'] && record['STT'] !== '' && !isNaN(Number(record['STT'])));
          return {
            style: {
              fontSize: 13,
              fontWeight: isBold ? 700 : 400,
              color: textPrimary,
              textAlign: colConfig.align,
              padding: '8px 12px',
            },
          };
        },
        render: (value: unknown) => {
          if (value === null || value === undefined) return '-';
          if (typeof value === 'number') {
            if (value === 0) return '-';
            return value.toLocaleString('vi-VN');
          }
          if (typeof value === 'boolean') {
            return value ? 'Đúng' : 'Sai';
          }
          let strVal = String(value);
          if (colConfig.align === 'left' && (h.includes('danh mục') || h.includes('tên'))) {
            strVal = strVal.replace(/^[\s\u00A0]+/, '');
          }
          const trimmed = strVal.trim();
          if (
            trimmed === '' ||
            (colConfig.align === 'right' &&
              (trimmed === '0' || trimmed === '0.0' || trimmed === '0,0'))
          ) {
            return '-';
          }
          return (
            <span
              title={trimmed}
              style={{
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'middle',
              }}
            >
              {strVal}
            </span>
          );
        },
      };
    });
  }, [reportData]);

  const totalColumnsWidth = useMemo(() => {
    return columns.reduce((acc, col) => acc + (col.width || 150), 0);
  }, [columns]);

  const rows = reportData?.rows || [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width="92vw"
      style={{ top: 24, maxWidth: 1440 }}
      rootClassName="report-preview-modal"
      styles={{
        body: { padding: '16px 24px' },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EyeOutlined style={{ color: '#0E6FD6', fontSize: 18 }} />
          <div>
            <Title level={5} style={{ margin: 0, fontSize: 16 }}>
              Xem trước báo cáo: {reportCode} - {reportName}
            </Title>
          </div>
        </div>
      }
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '4px 0',
          }}
        >
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center' }}>
            <Tag
              color="blue"
              style={{
                fontSize: 13,
                padding: '4px 14px',
                borderRadius: 999,
                fontWeight: 500,
                margin: 0,
              }}
            >
              Tổng số dòng: {rows.length.toLocaleString('vi-VN')}
            </Tag>
          </div>
          <Space size="middle">
            <Button
              icon={<FileExcelOutlined style={{ color: statusOperational }} />}
              onClick={() => onExport('EXCEL')}
              loading={loadingExport === 'EXCEL'}
              style={{
                borderColor: `${statusOperational}80`,
                color: statusOperational,
                borderRadius: radiusSm,
                fontWeight: 500,
              }}
            >
              Xuất Excel
            </Button>
            <Button
              icon={<FileTextOutlined style={{ color: colors.error }} />}
              onClick={() => onExport('PDF')}
              loading={loadingExport === 'PDF'}
              style={{
                borderColor: `${colors.error}80`,
                color: colors.error,
                borderRadius: radiusSm,
                fontWeight: 500,
              }}
            >
              Xuất PDF
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={onClose}
              style={{ borderRadius: radiusSm }}
            >
              Đóng
            </Button>
          </Space>
        </div>
      }
    >
      <style>{`
        .report-preview-modal .ant-table-thead > tr > th,
        .report-preview-modal .ant-table-thead > tr > th *,
        .report-preview-modal .ant-table-thead > tr > th .ant-table-column-title,
        .report-preview-modal .ant-table-thead > tr > th .ant-table-cell,
        .report-preview-modal .ant-table-thead > tr > th .ant-table-cell-content,
        .report-preview-modal .report-preview-th-content,
        .report-preview-modal-table .ant-table-thead > tr > th,
        .report-preview-modal-table .ant-table-thead > tr > th *,
        .report-preview-modal-table .ant-table-thead > tr > th .ant-table-column-title,
        .report-preview-modal-table .report-preview-th-content {
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          text-overflow: unset !important;
          overflow: visible !important;
          line-height: 1.35 !important;
          text-align: center !important;
          justify-content: center !important;
        }
        .report-preview-modal .ant-modal-footer {
          display: block !important;
          width: 100% !important;
          padding: 12px 24px !important;
          margin: 0 !important;
        }
      `}</style>
      {/* Header metadata cards */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          background: '#f8fafc',
          padding: '10px 16px',
          borderRadius: 6,
          border: '1px solid #e2e8f0',
          marginBottom: 16,
        }}
      >
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Đơn vị báo cáo: </Text>
          <Text strong style={{ fontSize: 13 }}>{orgUnitName || '---'}</Text>
        </div>
        <div style={{ width: 1, height: 16, background: '#cbd5e1' }} />
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Thời gian: </Text>
          <Text strong style={{ fontSize: 13 }}>{reportPeriodText || '---'}</Text>
        </div>
        <div style={{ width: 1, height: 16, background: '#cbd5e1' }} />
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Thời điểm kết xuất: </Text>
          <Text strong style={{ fontSize: 13 }}>{dayjs().format('DD/MM/YYYY HH:mm')}</Text>
        </div>
      </div>

      {/* Main detailed table inside modal */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 350,
          }}
        >
          <Spin tip="Đang tải dữ liệu chi tiết báo cáo..." size="large" />
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 350,
          }}
        >
          <Empty description="Không có số liệu chi tiết cho kỳ báo cáo đã chọn." />
        </div>
      ) : (
        <div style={{ overflow: 'hidden' }}>
          <Table
            rootClassName="report-preview-modal-table"
            columns={columns}
            dataSource={rows.map((row, idx) => ({ ...row, key: idx }))}
            pagination={false}
            bordered
            size="small"
            tableLayout="fixed"
            scroll={{
              x: Math.max(totalColumnsWidth, layout.listTableMinWidth),
              y: 'calc(80vh - 240px)',
            }}
            onRow={(record: Record<string, string | number | boolean | null>) => {
              const sequenceNo = record['STT'];
              if (
                record._rowType === 'section' ||
                sequenceNo === 'I' ||
                sequenceNo === 'II'
              ) {
                return {
                  style: { background: colors.bodyBg, fontWeight: 700 },
                };
              }
              if (sequenceNo && sequenceNo !== '' && !isNaN(Number(sequenceNo))) {
                return { style: { fontWeight: 600 } };
              }
              return {};
            }}
          />
        </div>
      )}
    </Modal>
  );
};

export default ReportPreviewModal;
