import { useState, useEffect, useMemo, useCallback } from 'react';
import { Form, Table, Input, InputNumber, Button } from 'antd';
import { BankOutlined, AppstoreOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { message } from '../../components/ToastNotification';
import { organizationService, type Organization } from '../../services/organizationService';
import { reportRecordService, type ReportRecord } from '../../services/reportRecordService';
import {
  DynamicFormSidebar,
  FormFieldType,
  type FormTabConfig,
  type FormSidebarAction,
} from '../../components/shared/dynamic-form-sidebar';
import {
  radiusPill,
  radiusMd,
  borderDefault,
  surfacePage,
  fontWeightBold,
  fontWeightMedium,
  colors,
} from '../../tokens';

export interface CommonReportFormDrawerProps {
  open: boolean;
  reportCode: string;
  reportTitle?: string;
  recordId?: string;
  initialOrgUnitId?: string;
  initialYear?: Dayjs | null;
  onClose: () => void;
  onSaved: () => void;
}

interface RowItem extends Record<string, unknown> {
  key: string;
  stt: string;
}

export default function CommonReportFormDrawer({
  open,
  reportCode,
  reportTitle,
  recordId,
  initialOrgUnitId,
  initialYear,
  onClose,
  onSaved,
}: CommonReportFormDrawerProps) {
  const [form] = Form.useForm();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState('DRAFT');
  const [rows, setRows] = useState<RowItem[]>([]);

  // Load organizations
  useEffect(() => {
    if (!open) return;
    void organizationService.list().then((resp) => {
      const list = [...(resp.data || [])];
      setOrganizations(list);
      if (!recordId) {
        const defaultOrg = list.find((o) => o.code === 'G17.43')?.id || list[0]?.id;
        form.setFieldValue('orgUnitId', initialOrgUnitId || defaultOrg);
        form.setFieldValue('reportYear', initialYear || dayjs());
        form.setFieldValue('reportPeriod', 'ANNUAL');
      }
    });
  }, [open, recordId, initialOrgUnitId, initialYear, form]);

  const initDefaultRows = useCallback((code: string): RowItem[] => {
    switch (code) {
      case 'F-170':
        return [
          { key: 'sec1', stt: 'I', chucDanh: 'THUYỀN VIÊN', h1: '', h2: '', h3: '', tong: '', isSection: true },
          { key: 'tv1', stt: '1', chucDanh: 'Thuyền trưởng', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'tv2', stt: '2', chucDanh: 'Đại phó', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'tv3', stt: '3', chucDanh: 'Sỹ quan boong', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'tv4', stt: '4', chucDanh: 'Thủy thủ trực ca', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'tv5', stt: '5', chucDanh: 'Máy trưởng', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'tv6', stt: '6', chucDanh: 'Máy hai', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'tv7', stt: '7', chucDanh: 'Sỹ quan máy', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'tv8', stt: '8', chucDanh: 'Thợ máy trực ca', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'sec2', stt: 'II', chucDanh: 'HOA TIÊU HÀNG HẢI', h1: '', h2: '', h3: '', tong: '', isSection: true },
          { key: 'ht1', stt: '1', chucDanh: 'Hoa tiêu Ngoại hạng', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'ht2', stt: '2', chucDanh: 'Hoa tiêu Hạng 1', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'ht3', stt: '3', chucDanh: 'Hoa tiêu Hạng 2', h1: 0, h2: 0, h3: 0, tong: 0 },
          { key: 'ht4', stt: '4', chucDanh: 'Hoa tiêu Hạng 3', h1: 0, h2: 0, h3: 0, tong: 0 },
        ];
      case 'F-171':
        return [
          { key: 't1', stt: '1', loaiTau: 'Tàu chở hàng khô tổng hợp', soLuong: 0, gt: 0, dwt: 0, congSuat: 0, tuoiTau: 0 },
          { key: 't2', stt: '2', loaiTau: 'Tàu chở hàng rời', soLuong: 0, gt: 0, dwt: 0, congSuat: 0, tuoiTau: 0 },
          { key: 't3', stt: '3', loaiTau: 'Tàu chở container', soLuong: 0, gt: 0, dwt: 0, congSuat: 0, tuoiTau: 0 },
          { key: 't4', stt: '4', loaiTau: 'Tàu chở dầu/hóa chất', soLuong: 0, gt: 0, dwt: 0, congSuat: 0, tuoiTau: 0 },
          { key: 't5', stt: '5', loaiTau: 'Tàu chở khí hóa lỏng', soLuong: 0, gt: 0, dwt: 0, congSuat: 0, tuoiTau: 0 },
          { key: 't6', stt: '6', loaiTau: 'Tàu chở khách', soLuong: 0, gt: 0, dwt: 0, congSuat: 0, tuoiTau: 0 },
          { key: 't7', stt: '7', loaiTau: 'Tàu chuyên dùng khác', soLuong: 0, gt: 0, dwt: 0, congSuat: 0, tuoiTau: 0 },
        ];
      case 'F-172':
        return [
          { key: 'l1', stt: '1', tenDn: 'Công ty CP Lai dắt Hàng hải', tenTau: 'Tàu lai Tân Cảng 01', imo: 'IMO9123456', congSuat: 3500, namDong: 2019, vungHd: 'Hải Phòng', tinhTrang: 'Tốt' },
        ];
      case 'F-173':
        return [
          { key: 'cs1', stt: '1', tenCoSo: 'Công ty Đóng tàu Phà Rừng', diaChi: 'Hải Phòng', loaiHinh: 'Đóng mới và sửa chữa', nlDongMoi: 34000, nlSuaChua: 50000, soLuongU: 2, tinhTrang: 'Hoạt động tốt' },
        ];
      case 'F-174':
        return [
          { key: 'c1', stt: '1', tenCang: 'Khu vực Cảng biển Hải Phòng', xk: 2500000, nk: 3200000, nd: 1800000, qc: 150000, tong: 7650000, teus: 540000 },
        ];
      case 'F-175':
        return [
          { key: 'b1', stt: '1', tenBen: 'Bến cảng Đình Vũ', dvql: 'Công ty CP Cảng Đình Vũ', chieuDai: 420, doSau: -11.0, coTau: 25000, csThietKe: 4.5, thucTe: 4.2 },
        ];
      case 'F-176':
        return [
          { key: 'btn1', stt: '1', tenCang: 'Bến thủy nội địa Tân Vũ', diaPhuong: 'Công ty TNHH Tiếp vận TNV', soBen: 2, chieuDai: 160, coTau: 2000, csThietKe: 0.8, thucTe: 0.75 },
        ];
      case 'F-179':
        return [
          { key: 'lv1', stt: '1', linhVuc: 'Vận tải đường biển', soDn: 45, vanChuyen: 15200.5, luanChuyen: 85200.0, khach: 1250.0, doanhThu: 12500.0 },
          { key: 'lv2', stt: '2', linhVuc: 'Vận tải đường thủy nội địa', soDn: 120, vanChuyen: 32100.0, luanChuyen: 42100.0, khach: 3500.0, doanhThu: 6800.0 },
          { key: 'lv3', stt: '3', linhVuc: 'Dịch vụ hỗ trợ vận tải biển', soDn: 85, vanChuyen: 0.0, luanChuyen: 0.0, khach: 0.0, doanhThu: 18500.0 },
          { key: 'lv4', stt: '4', linhVuc: 'Logistics và dịch vụ khác', soDn: 60, vanChuyen: 0.0, luanChuyen: 0.0, khach: 0.0, doanhThu: 9200.0 },
        ];
      default:
        return [
          { key: 'r1', stt: '1', chiTieu: 'Chỉ tiêu số 1', donVi: 'Tấn', keHoach: 1000, thucHien: 980, soSanh: 98.0 },
        ];
    }
  }, []);

  // Load existing record or default rows
  useEffect(() => {
    if (!open) return;
    if (recordId) {
      void reportRecordService.getById(recordId).then((rec) => {
        form.setFieldsValue({
          orgUnitId: rec.orgUnitId,
          reportYear: dayjs().year(rec.reportYear),
          reportPeriod: rec.reportPeriod,
          notes: rec.notes,
        });
        if (rec.reportData) {
          try {
            const parsed = JSON.parse(rec.reportData) as RowItem[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setRows(parsed);
              return;
            }
          } catch {
            // fallback
          }
        }
        setRows(initDefaultRows(reportCode));
      }).catch(() => {
        message.error('Không thể tải dữ liệu báo cáo');
        setRows(initDefaultRows(reportCode));
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- khởi tạo rows khi mở form hoặc chuyển mã báo cáo
      setRows(initDefaultRows(reportCode));
    }
  }, [open, recordId, reportCode, form, initDefaultRows]);

  const updateCell = useCallback((key: string, field: string, val: unknown) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const updated = { ...r, [field]: val };
        // Auto-calc for F-170
        if (reportCode === 'F-170') {
          const h1 = Number(updated.h1) || 0;
          const h2 = Number(updated.h2) || 0;
          const h3 = Number(updated.h3) || 0;
          updated.tong = h1 + h2 + h3;
        }
        // Auto-calc for F-174
        if (reportCode === 'F-174') {
          const xk = Number(updated.xk) || 0;
          const nk = Number(updated.nk) || 0;
          const nd = Number(updated.nd) || 0;
          const qc = Number(updated.qc) || 0;
          updated.tong = xk + nk + nd + qc;
        }
        return updated;
      })
    );
  }, [reportCode]);

  const addRow = useCallback(() => {
    const newIdx = rows.length + 1;
    const newKey = `custom_${Date.now()}`;
    const newRow: RowItem = {
      key: newKey,
      stt: String(newIdx),
    };
    if (reportCode === 'F-172') {
      newRow.tenDn = 'Doanh nghiệp mới';
      newRow.tenTau = 'Tàu lai mới';
      newRow.imo = '';
      newRow.congSuat = 0;
      newRow.namDong = dayjs().year();
      newRow.vungHd = '';
      newRow.tinhTrang = 'Tốt';
    } else if (reportCode === 'F-173') {
      newRow.tenCoSo = 'Cơ sở mới';
      newRow.diaChi = '';
      newRow.loaiHinh = 'Đóng mới';
      newRow.nlDongMoi = 0;
      newRow.nlSuaChua = 0;
      newRow.soLuongU = 1;
      newRow.tinhTrang = 'Tốt';
    } else if (reportCode === 'F-175') {
      newRow.tenBen = 'Bến/Cầu cảng mới';
      newRow.dvql = '';
      newRow.chieuDai = 0;
      newRow.doSau = 0;
      newRow.coTau = 0;
      newRow.csThietKe = 0;
      newRow.thucTe = 0;
    } else if (reportCode === 'F-176') {
      newRow.tenCang = 'Bến TNĐ mới';
      newRow.diaPhuong = '';
      newRow.soBen = 1;
      newRow.chieuDai = 0;
      newRow.coTau = 0;
      newRow.csThietKe = 0;
      newRow.thucTe = 0;
    } else {
      newRow.chiTieu = 'Chỉ tiêu bổ sung';
      newRow.donVi = 'Tấn';
      newRow.keHoach = 0;
      newRow.thucHien = 0;
      newRow.soSanh = 0;
    }
    setRows((prev) => [...prev, newRow]);
  }, [rows.length, reportCode]);

  const removeRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const columns = useMemo(() => {
    const isListReport = ['F-172', 'F-173', 'F-175', 'F-176'].includes(reportCode);

    const baseCols = (() => {
      switch (reportCode) {
        case 'F-170':
          return [
            { title: 'STT', dataIndex: 'stt', width: 60, align: 'center' as const },
            {
              title: 'Chức danh',
              dataIndex: 'chucDanh',
              width: 220,
              onCell: (r: RowItem) => ({ style: { fontWeight: r.isSection ? fontWeightBold : fontWeightMedium, background: r.isSection ? surfacePage : undefined } }),
            },
            {
              title: 'Hạng 1',
              dataIndex: 'h1',
              width: 120,
              render: (v: unknown, r: RowItem) => r.isSection ? null : (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'h1', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Hạng 2',
              dataIndex: 'h2',
              width: 120,
              render: (v: unknown, r: RowItem) => r.isSection ? null : (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'h2', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Hạng 3',
              dataIndex: 'h3',
              width: 120,
              render: (v: unknown, r: RowItem) => r.isSection ? null : (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'h3', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Tổng số',
              dataIndex: 'tong',
              width: 130,
              render: (v: unknown, r: RowItem) => r.isSection ? null : (
                <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{(Number(v) || 0).toLocaleString('vi-VN')}</span>
              ),
            },
          ];

        case 'F-171':
          return [
            { title: 'STT', dataIndex: 'stt', width: 60, align: 'center' as const },
            { title: 'Loại tàu', dataIndex: 'loaiTau', width: 220 },
            {
              title: 'Số lượng (Chiếc)',
              dataIndex: 'soLuong',
              width: 130,
              render: (v: unknown, r: RowItem) => (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'soLuong', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Tổng GT',
              dataIndex: 'gt',
              width: 130,
              render: (v: unknown, r: RowItem) => (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'gt', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Tổng DWT',
              dataIndex: 'dwt',
              width: 130,
              render: (v: unknown, r: RowItem) => (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'dwt', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Công suất (CV)',
              dataIndex: 'congSuat',
              width: 130,
              render: (v: unknown, r: RowItem) => (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'congSuat', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Tuổi bình quân',
              dataIndex: 'tuoiTau',
              width: 120,
              render: (v: unknown, r: RowItem) => (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'tuoiTau', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
          ];

        case 'F-172':
          return [
            { title: 'STT', dataIndex: 'stt', width: 60, align: 'center' as const },
            {
              title: 'Tên doanh nghiệp',
              dataIndex: 'tenDn',
              width: 220,
              render: (v: unknown, r: RowItem) => <Input value={String(v || '')} onChange={(e) => updateCell(r.key, 'tenDn', e.target.value)} style={{ borderRadius: radiusPill }} />,
            },
            {
              title: 'Tên tàu lai',
              dataIndex: 'tenTau',
              width: 180,
              render: (v: unknown, r: RowItem) => <Input value={String(v || '')} onChange={(e) => updateCell(r.key, 'tenTau', e.target.value)} style={{ borderRadius: radiusPill }} />,
            },
            {
              title: 'Số IMO',
              dataIndex: 'imo',
              width: 130,
              render: (v: unknown, r: RowItem) => <Input value={String(v || '')} onChange={(e) => updateCell(r.key, 'imo', e.target.value)} style={{ borderRadius: radiusPill }} />,
            },
            {
              title: 'Công suất (CV)',
              dataIndex: 'congSuat',
              width: 130,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'congSuat', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
            {
              title: 'Vùng hoạt động',
              dataIndex: 'vungHd',
              width: 180,
              render: (v: unknown, r: RowItem) => <Input value={String(v || '')} onChange={(e) => updateCell(r.key, 'vungHd', e.target.value)} style={{ borderRadius: radiusPill }} />,
            },
          ];

        case 'F-174':
          return [
            { title: 'STT', dataIndex: 'stt', width: 60, align: 'center' as const },
            { title: 'Cảng biển / Bến cảng', dataIndex: 'tenCang', width: 220 },
            {
              title: 'Xuất khẩu (Tấn)',
              dataIndex: 'xk',
              width: 130,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'xk', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
            {
              title: 'Nhập khẩu (Tấn)',
              dataIndex: 'nk',
              width: 130,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'nk', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
            {
              title: 'Nội địa (Tấn)',
              dataIndex: 'nd',
              width: 130,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'nd', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
            {
              title: 'Tổng số (Tấn)',
              dataIndex: 'tong',
              width: 140,
              render: (v: unknown) => <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>{(Number(v) || 0).toLocaleString('vi-VN')}</span>,
            },
            {
              title: 'Container (TEUs)',
              dataIndex: 'teus',
              width: 130,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'teus', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
          ];

        case 'F-179':
          return [
            { title: 'STT', dataIndex: 'stt', width: 60, align: 'center' as const },
            { title: 'Lĩnh vực hoạt động', dataIndex: 'linhVuc', width: 260 },
            {
              title: 'Số DN',
              dataIndex: 'soDn',
              width: 100,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'soDn', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
            {
              title: 'Vận chuyển (Nghìn Tấn)',
              dataIndex: 'vanChuyen',
              width: 150,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'vanChuyen', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
            {
              title: 'Luân chuyển (Triệu Tấn.km)',
              dataIndex: 'luanChuyen',
              width: 160,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'luanChuyen', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
            {
              title: 'Doanh thu (Tỷ đồng)',
              dataIndex: 'doanhThu',
              width: 140,
              render: (v: unknown, r: RowItem) => <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, 'doanhThu', val)} style={{ width: '100%', borderRadius: radiusPill }} />,
            },
          ];

        default:
          return [
            { title: 'STT', dataIndex: 'stt', width: 60, align: 'center' as const },
            {
              title: 'Tên mục / Chỉ tiêu',
              dataIndex: reportCode === 'F-173' ? 'tenCoSo' : reportCode === 'F-175' ? 'tenBen' : 'tenCang',
              width: 240,
              render: (v: unknown, r: RowItem) => (
                <Input value={String(v || '')} onChange={(e) => updateCell(r.key, reportCode === 'F-173' ? 'tenCoSo' : reportCode === 'F-175' ? 'tenBen' : 'tenCang', e.target.value)} style={{ borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Đơn vị / Địa phương',
              dataIndex: reportCode === 'F-173' ? 'diaChi' : reportCode === 'F-175' ? 'dvql' : 'diaPhuong',
              width: 200,
              render: (v: unknown, r: RowItem) => (
                <Input value={String(v || '')} onChange={(e) => updateCell(r.key, reportCode === 'F-173' ? 'diaChi' : reportCode === 'F-175' ? 'dvql' : 'diaPhuong', e.target.value)} style={{ borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Công suất TK (Triệu tấn)',
              dataIndex: reportCode === 'F-173' ? 'nlDongMoi' : 'csThietKe',
              width: 140,
              render: (v: unknown, r: RowItem) => (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, reportCode === 'F-173' ? 'nlDongMoi' : 'csThietKe', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
            {
              title: 'Thực tế (Triệu tấn)',
              dataIndex: reportCode === 'F-173' ? 'nlSuaChua' : 'thucTe',
              width: 140,
              render: (v: unknown, r: RowItem) => (
                <InputNumber min={0} value={Number(v) || 0} onChange={(val) => updateCell(r.key, reportCode === 'F-173' ? 'nlSuaChua' : 'thucTe', val)} style={{ width: '100%', borderRadius: radiusPill }} />
              ),
            },
          ];
      }
    })();

    if (isListReport) {
      return [
        ...baseCols,
        {
          title: 'Thao tác',
          key: 'action',
          width: 80,
          align: 'center' as const,
          render: (_: unknown, r: RowItem) => (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRow(r.key)}
            />
          ),
        },
      ];
    }
    return baseCols;
  }, [reportCode, updateCell, removeRow]);

  const handleSave = useCallback(async (targetAction: string) => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setSaveAction(targetAction);

      const reportYear = values.reportYear ? dayjs(values.reportYear).year() : dayjs().year();

      const payload: Partial<ReportRecord> = {
        id: recordId,
        orgUnitId: values.orgUnitId,
        reportCode,
        reportPeriod: values.reportPeriod || 'ANNUAL',
        reportYear,
        status: targetAction,
        reportData: JSON.stringify(rows),
        notes: values.notes,
      };

      if (recordId) {
        await reportRecordService.update(recordId, payload);
      } else {
        await reportRecordService.save(payload);
      }

      message.success(
        targetAction === 'APPROVED'
          ? 'Đã lưu và phê duyệt số liệu báo cáo thành công!'
          : 'Đã lưu tạm số liệu báo cáo thành công!'
      );
      onSaved();
    } catch (err) {
      console.error(err);
      message.error('Không thể lưu số liệu báo cáo');
    } finally {
      setSaving(false);
    }
  }, [form, recordId, reportCode, rows, onSaved]);

  const isListReport = ['F-172', 'F-173', 'F-175', 'F-176'].includes(reportCode);

  const formTabs = useMemo<FormTabConfig[]>(() => {
    return [
      {
        key: 'general',
        label: 'Thông tin chung',
        sections: [
          {
            key: 'report_info',
            title: 'Thông tin báo cáo',
            icon: <BankOutlined />,
            fields: [
              {
                name: 'orgUnitId',
                label: 'Đơn vị báo cáo',
                type: FormFieldType.TreeSelect,
                organizations,
                required: true,
                rules: [{ required: true, message: 'Đơn vị báo cáo là bắt buộc' }],
              },
              {
                name: 'reportYear',
                label: 'Năm báo cáo',
                type: FormFieldType.Year,
                required: true,
                rules: [{ required: true, message: 'Năm báo cáo là bắt buộc' }],
              },
              {
                name: 'reportPeriod',
                label: 'Kỳ báo cáo',
                type: FormFieldType.Select,
                options: [
                  { value: 'ANNUAL', label: 'Cả năm' },
                  { value: 'MONTHLY', label: 'Tháng' },
                  { value: 'QUARTERLY', label: 'Quý' },
                  { value: 'SEMI_ANNUAL', label: '6 tháng' },
                ],
              },
              {
                name: 'notes',
                label: 'Ghi chú',
                type: FormFieldType.Text,
                placeholder: 'Nhập ghi chú thêm nếu có',
                colSpan: 24,
              },
            ],
          },
          {
            key: 'data_entry',
            title: `Bảng số liệu báo cáo — ${reportCode}`,
            icon: <AppstoreOutlined />,
            fields: [
              {
                name: 'dataTable',
                label: '',
                type: FormFieldType.Custom,
                colSpan: 24,
                customRender: () => (
                  <div>
                    {isListReport && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={addRow}
                          style={{ borderRadius: radiusPill }}
                        >
                          + Thêm dòng
                        </Button>
                      </div>
                    )}
                    <Table
                      bordered
                      columns={columns}
                      dataSource={rows}
                      pagination={false}
                      rowKey="key"
                      scroll={{ x: 'max-content', y: 400 }}
                      style={{ border: `1px solid ${borderDefault}`, borderRadius: radiusMd }}
                    />
                  </div>
                ),
              },
            ],
          },
        ],
      },
    ];
  }, [organizations, reportCode, isListReport, addRow, columns, rows]);

  const footerActions = useMemo<FormSidebarAction[]>(() => [
    {
      key: 'cancel',
      label: 'Hủy',
      variant: 'subtle',
      onClick: onClose,
    },
    {
      key: 'draft',
      label: 'Lưu tạm',
      variant: 'outline',
      loading: saving && saveAction === 'DRAFT',
      onClick: () => void handleSave('DRAFT'),
    },
    {
      key: 'approve',
      label: 'Lưu và phê duyệt',
      variant: 'success',
      loading: saving && saveAction === 'APPROVED',
      onClick: () => void handleSave('APPROVED'),
    },
  ], [saving, saveAction, onClose, handleSave]);

  const title = recordId
    ? `Chỉnh sửa số liệu báo cáo — ${reportCode}${reportTitle ? ` (${reportTitle})` : ''}`
    : `Thêm mới số liệu báo cáo — ${reportCode}${reportTitle ? ` (${reportTitle})` : ''}`;

  return (
    <DynamicFormSidebar
      open={open}
      title={title}
      onClose={onClose}
      form={form}
      tabs={formTabs}
      footerActions={footerActions}
      footerAlign="center"
      width={
        typeof window !== 'undefined'
          ? Math.min(1150, Math.floor(window.innerWidth * 0.95))
          : 1150
      }
    />
  );
}
