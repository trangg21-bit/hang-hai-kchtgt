import { useCallback, useEffect, useState } from 'react';
import { Button, Col, DatePicker, Divider, Form, Input, InputNumber, Modal, Row, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { shipPortCallCRUD } from '../../services/shipPortCallService';
import { usePermissionStore } from '../../store/permissionStore';
import { FilterOrgUnitTreeSelect, FormOrgUnitTreeSelect } from '../../components/org-unit';
import { DataTable, FilterTableLayout, ScreenHeader } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import type { DataTableColumn } from '../../components/list-view/DataTable';
import toast from '../../components/ToastNotification';
import { getDatePickerProps, getRangePickerProps } from '../../themetokenchk';
import {
  inputStyle,
  primaryButtonStyle,
  radiusPill,
  selectStyle,
  spaceFormField,
  spaceSm,
  textPrimary,
  fontSizeMd,
  fontWeightMedium,
} from '../../tokens';
import type {
  CreateShipPortCallRequest,
  ShipPortCallListParams,
  ShipPortCallResponse,
} from '../../types/shipPortCall';

const PAGE_SIZE = 20;

type DateRange = [Dayjs | null, Dayjs | null] | null;

const fmtDate = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '—');

const toDayString = (d?: Dayjs | null): string | undefined => (d ? d.format('YYYY-MM-DD') : undefined);

const trimText = (v: unknown): string | undefined => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || undefined;
};

const toNumber = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Tàu biển ra vào cảng biển — M-025 / F-300 (ShipPortCall register).
 * Màn danh sách KHÔNG có StatusTabs, KHÔNG có detail drawer (Sửa/Xem chi tiết = false,
 * feature-brief §5 dòng 8); chỉ list + popup Tạo mới. Không có cột hành khách/trạng thái
 * (design §10 U-1..U-6: passengers/status bị ẩn/loại trừ).
 */
export default function ShipPortCallPage() {
  const hasPermission = usePermissionStore((s) => s.hasPermission);
  const canCreate = hasPermission('shipportcall:create');

  const [form] = Form.useForm();

  const [data, setData] = useState<ShipPortCallResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ── Bộ lọc sidebar ──
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [orgUnitId, setOrgUnitId] = useState<string | undefined>();
  const [reportRange, setReportRange] = useState<DateRange>(null);
  const [arrivalRange, setArrivalRange] = useState<DateRange>(null);
  const [departureRange, setDepartureRange] = useState<DateRange>(null);

  // ── Popup Tạo mới ──
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const buildParams = useCallback((): ShipPortCallListParams => {
    return {
      orgUnitId,
      keyword: keyword || undefined,
      reportDateFrom: toDayString(reportRange?.[0]),
      reportDateTo: toDayString(reportRange?.[1]),
      arrivalDateFrom: toDayString(arrivalRange?.[0]),
      arrivalDateTo: toDayString(arrivalRange?.[1]),
      departureDateFrom: toDayString(departureRange?.[0]),
      departureDateTo: toDayString(departureRange?.[1]),
    };
  }, [keyword, orgUnitId, reportRange, arrivalRange, departureRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await shipPortCallCRUD.list({ ...buildParams(), page: page - 1, size: PAGE_SIZE });
      setData(res.items);
      setTotal(res.total);
    } catch {
      setError(true);
      setErrorMessage('Không thể tải danh sách tàu biển ra vào cảng biển. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [buildParams, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = useCallback(() => {
    setKeyword(keywordInput.trim());
    setPage(1);
  }, [keywordInput]);

  const handleFilterReset = useCallback(() => {
    setKeywordInput('');
    setKeyword('');
    setOrgUnitId(undefined);
    setReportRange(null);
    setArrivalRange(null);
    setDepartureRange(null);
    setPage(1);
  }, []);

  const handleRangeChange = (setter: (v: DateRange) => void) => (dates: DateRange) => setter(dates);

  // ── Columns (ma trận: Danh sách = ✓ rows 1-5; KHÔNG cột hành khách/trạng thái) ──
  const columns: DataTableColumn[] = [
    {
      key: 'orgUnitName',
      label: 'Đơn vị quản lý',
      dataIndex: 'orgUnitName',
      width: 220,
      render: (v: unknown) => (v ? <span title={String(v)}>{String(v)}</span> : '—'),
      cellTitle: (r: ShipPortCallResponse) => r?.orgUnitName || '',
    },
    {
      key: 'reportDate',
      label: 'Ngày báo cáo',
      dataIndex: 'reportDate',
      width: 140,
      align: 'center',
      render: (v: unknown) => fmtDate(typeof v === 'string' ? v : undefined),
    },
    {
      key: 'reportCode',
      label: 'Mã báo cáo',
      dataIndex: 'reportCode',
      width: 160,
      render: (v: unknown) => (v ? <span title={String(v)}>{String(v)}</span> : '—'),
      cellTitle: (r: ShipPortCallResponse) => r?.reportCode || '',
    },
    {
      key: 'reportName',
      label: 'Tên báo cáo',
      dataIndex: 'reportName',
      width: 260,
      render: (v: unknown) => (v ? <span title={String(v)}>{String(v)}</span> : '—'),
      cellTitle: (r: ShipPortCallResponse) => r?.reportName || '',
    },
    {
      key: 'reportPeriod',
      label: 'Kỳ báo cáo',
      dataIndex: 'reportPeriod',
      width: 180,
      render: (v: unknown) => (v ? <span title={String(v)}>{String(v)}</span> : '—'),
      cellTitle: (r: ShipPortCallResponse) => r?.reportPeriod || '',
    },
  ];

  const handleCreate = useCallback(async () => {
    let values: Record<string, unknown>;
    try {
      values = await form.validateFields();
    } catch {
      return; // rules đã hiển thị message tiếng Việt
    }
    const payload: CreateShipPortCallRequest = {
      orgUnitId: String(values.orgUnitId ?? '').trim(),
      reportDate: toDayString(values.reportDate as Dayjs | null | undefined) ?? '',
      shipName: trimText(values.shipName) ?? '',
      callSign: trimText(values.callSign),
      imoNumber: trimText(values.imoNumber),
      nationality: trimText(values.nationality),
      shipType: trimText(values.shipType),
      length: toNumber(values.length),
      draftArrivalDeparture: toNumber(values.draftArrivalDeparture),
      dwt: toNumber(values.dwt),
      gt: toNumber(values.gt),
      airDraftActual: toNumber(values.airDraftActual),
      exportTons: toNumber(values.exportTons),
      exportTeus: toNumber(values.exportTeus),
      exportEmptyTeus: toNumber(values.exportEmptyTeus),
      importTons: toNumber(values.importTons),
      importTeus: toNumber(values.importTeus),
      importEmptyTeus: toNumber(values.importEmptyTeus),
      domesticInTons: toNumber(values.domesticInTons),
      domesticInTeus: toNumber(values.domesticInTeus),
      domesticInEmptyTeus: toNumber(values.domesticInEmptyTeus),
      domesticOutTons: toNumber(values.domesticOutTons),
      domesticOutTeus: toNumber(values.domesticOutTeus),
      domesticOutEmptyTeus: toNumber(values.domesticOutEmptyTeus),
      transshipmentTons: toNumber(values.transshipmentTons),
      transshipmentTeus: toNumber(values.transshipmentTeus),
      transitHandlingTons: toNumber(values.transitHandlingTons),
      transitHandlingTeus: toNumber(values.transitHandlingTeus),
      transitNoHandlingTons: toNumber(values.transitNoHandlingTons),
      transitNoHandlingTeus: toNumber(values.transitNoHandlingTeus),
      cargoGroup: trimText(values.cargoGroup),
      cargoType: trimText(values.cargoType),
      cargoName: trimText(values.cargoName),
      lastPortOfCall: trimText(values.lastPortOfCall),
      arrivalPortName: trimText(values.arrivalPortName),
      arrivalPortCode: trimText(values.arrivalPortCode),
      departurePortName: trimText(values.departurePortName),
      departurePortCode: trimText(values.departurePortCode),
      destinationPort: trimText(values.destinationPort),
      arrivalDate: toDayString(values.arrivalDate as Dayjs | null | undefined),
      departureDate: toDayString(values.departureDate as Dayjs | null | undefined),
      islandRoute: (values.islandRoute as 'NO' | 'YES' | undefined) || undefined,
      dangerousGoods: (values.dangerousGoods as 'NO' | 'YES' | undefined) || undefined,
      shipAgent: trimText(values.shipAgent),
      enterpriseCode: trimText(values.enterpriseCode),
    };
    setSaving(true);
    try {
      await shipPortCallCRUD.create(payload);
      toast.success('Thêm mới thành công');
      setCreateOpen(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      const message = (err as { message?: string })?.message || 'Thêm mới thất bại';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [form, fetchData]);

  const openCreate = useCallback(() => {
    form.resetFields();
    setCreateOpen(true);
  }, [form]);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    form.resetFields();
  }, [form]);

  const textField = (name: string, label: string, placeholder?: string, span = 8) => (
    <Col span={span}>
      <Form.Item name={name} label={label} style={{ marginBottom: spaceFormField }}>
        <Input style={inputStyle} placeholder={placeholder || `Nhập ${label.toLowerCase()}`} allowClear />
      </Form.Item>
    </Col>
  );

  const numberField = (name: string, label: string, placeholder = '0', span = 8) => (
    <Col span={span}>
      <Form.Item name={name} label={label} style={{ marginBottom: spaceFormField }}>
        <InputNumber min={0} style={{ ...inputStyle, width: '100%' }} placeholder={placeholder} />
      </Form.Item>
    </Col>
  );

  const dateField = (name: string, label: string, span = 8) => (
    <Col span={span}>
      <Form.Item name={name} label={label} style={{ marginBottom: spaceFormField }}>
        <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
      </Form.Item>
    </Col>
  );

  const yesNoField = (name: string, label: string) => (
    <Col span={8}>
      <Form.Item name={name} label={label} style={{ marginBottom: spaceFormField }}>
        <Select
          style={selectStyle}
          placeholder="Chọn"
          allowClear
          options={[
            { value: 'YES', label: 'Có' },
            { value: 'NO', label: 'Không' },
          ]}
        />
      </Form.Item>
    </Col>
  );

  const sectionDivider = (title: string) => (
    <Divider plain style={{ margin: `${spaceSm}px 0 ${spaceFormField}px` }}>
      <span style={{ color: textPrimary, fontSize: fontSizeMd, fontWeight: fontWeightMedium }}>{title}</span>
    </Divider>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <ScreenHeader
        breadcrumbs={[
          { label: 'Quản lý quy hoạch & vận hành' },
          { label: 'Tàu biển ra vào cảng biển' },
        ]}
        actions={
          canCreate
            ? [{ key: 'create', label: 'Thêm mới', icon: <PlusOutlined />, variant: 'primary', onClick: openCreate }]
            : []
        }
      />

      <FilterTableLayout
        hideFilterToggle
        hideStatusTabs
        onFilterApply={applyFilters}
        onFilterReset={handleFilterReset}
        loading={loading}
        error={error}
        errorMessage={errorMessage}
        onRetry={fetchData}
        filterContent={
          <Form layout="vertical" onFinish={applyFilters}>
            <Form.Item label="Đơn vị quản lý" style={{ marginBottom: spaceFormField }}>
              <FilterOrgUnitTreeSelect value={orgUnitId} onChange={setOrgUnitId} placeholder="Chọn đơn vị quản lý" />
            </Form.Item>
            <Form.Item label="Tìm kiếm từ khóa" style={{ marginBottom: spaceFormField }}>
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onPressEnter={applyFilters}
                style={inputStyle}
                placeholder="Tên tàu, hô hiệu, số IMO"
                allowClear
              />
            </Form.Item>
            <Form.Item label="Ngày báo cáo" style={{ marginBottom: spaceFormField }}>
              <DatePicker.RangePicker
                {...getRangePickerProps()}
                value={reportRange}
                onChange={handleRangeChange(setReportRange)}
                style={{ ...inputStyle, width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Form.Item>
            <Form.Item label="Ngày đến cảng" style={{ marginBottom: spaceFormField }}>
              <DatePicker.RangePicker
                {...getRangePickerProps()}
                value={arrivalRange}
                onChange={handleRangeChange(setArrivalRange)}
                style={{ ...inputStyle, width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Form.Item>
            <Form.Item label="Ngày rời cảng" style={{ marginBottom: spaceSm }}>
              <DatePicker.RangePicker
                {...getRangePickerProps()}
                value={departureRange}
                onChange={handleRangeChange(setDepartureRange)}
                style={{ ...inputStyle, width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Form.Item>
          </Form>
        }
      >
        <DataTable columns={columns} dataSource={data} rowKey="id" loading={loading} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: `${spaceSm}px 0 0` }}>
          <Pagination
            total={total}
            current={page}
            pageSize={PAGE_SIZE}
            onChange={(nextPage: number) => setPage(nextPage)}
          />
        </div>
      </FilterTableLayout>

      <Modal
        title="Thêm mới tàu biển ra vào cảng biển"
        open={createOpen}
        onCancel={closeCreate}
        width={1040}
        footer={[
          <Button key="cancel" style={{ borderRadius: radiusPill, height: 40, marginRight: spaceSm }} onClick={closeCreate}>
            Hủy
          </Button>,
          <Button key="save" type="primary" loading={saving} style={{ ...primaryButtonStyle }} onClick={handleCreate}>
            Lưu
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          {sectionDivider('Thông tin chung')}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orgUnitId"
                label="Đơn vị báo cáo"
                required
                style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị báo cáo' }]}
              >
                <FormOrgUnitTreeSelect placeholder="Chọn đơn vị báo cáo" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reportDate"
                label="Ngày báo cáo"
                required
                style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Vui lòng chọn ngày báo cáo' }]}
              >
                <DatePicker {...getDatePickerProps()} style={{ ...inputStyle, width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
              </Form.Item>
            </Col>
          </Row>

          {sectionDivider('Thông tin tàu')}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="shipName"
                label="Tên tàu"
                required
                style={{ marginBottom: spaceFormField }}
                rules={[{ required: true, message: 'Vui lòng nhập tên tàu' }]}
              >
                <Input style={inputStyle} placeholder="Nhập tên tàu" allowClear />
              </Form.Item>
            </Col>
            {textField('callSign', 'Hô hiệu')}
            {textField('imoNumber', 'Số IMO')}
            {textField('nationality', 'Quốc tịch')}
            {textField('shipType', 'Loại tàu')}
            {numberField('length', 'Chiều dài (m)')}
            {numberField('draftArrivalDeparture', 'Mớn nước đến/đi (m)')}
            {numberField('dwt', 'DWT (tấn)')}
            {numberField('gt', 'GT')}
            {numberField('airDraftActual', 'Chiều cao thực tế (m)')}
          </Row>

          {sectionDivider('Hàng hóa — Xuất khẩu')}
          <Row gutter={16}>
            {numberField('exportTons', 'Hàng hóa xuất khẩu — Tấn')}
            {numberField('exportTeus', 'Hàng hóa xuất khẩu — Teus')}
            {numberField('exportEmptyTeus', 'Hàng hóa xuất khẩu — Teus rỗng')}
          </Row>

          {sectionDivider('Hàng hóa — Nhập khẩu')}
          <Row gutter={16}>
            {numberField('importTons', 'Hàng hóa nhập khẩu — Tấn')}
            {numberField('importTeus', 'Hàng hóa nhập khẩu — Teus')}
            {numberField('importEmptyTeus', 'Hàng hóa nhập khẩu — Teus rỗng')}
          </Row>

          {sectionDivider('Hàng hóa — Nội địa đến')}
          <Row gutter={16}>
            {numberField('domesticInTons', 'Hàng hóa nội địa đến — Tấn')}
            {numberField('domesticInTeus', 'Hàng hóa nội địa đến — Teus')}
            {numberField('domesticInEmptyTeus', 'Hàng hóa nội địa đến — Teus rỗng')}
          </Row>

          {sectionDivider('Hàng hóa — Nội địa rời')}
          <Row gutter={16}>
            {numberField('domesticOutTons', 'Hàng hóa nội địa rời — Tấn')}
            {numberField('domesticOutTeus', 'Hàng hóa nội địa rời — Teus')}
            {numberField('domesticOutEmptyTeus', 'Hàng hóa nội địa rời — Teus rỗng')}
          </Row>

          {sectionDivider('Hàng hóa — Chuyển tải')}
          <Row gutter={16}>
            {numberField('transshipmentTons', 'Hàng hóa chuyển tải — Tấn')}
            {numberField('transshipmentTeus', 'Hàng hóa chuyển tải — Teus')}
          </Row>

          {sectionDivider('Hàng hóa — Quá cảnh (bốc dỡ)')}
          <Row gutter={16}>
            {numberField('transitHandlingTons', 'Hàng hóa quá cảnh bốc dỡ — Tấn')}
            {numberField('transitHandlingTeus', 'Hàng hóa quá cảnh bốc dỡ — Teus')}
          </Row>

          {sectionDivider('Hàng hóa — Quá cảnh (không bốc dỡ)')}
          <Row gutter={16}>
            {numberField('transitNoHandlingTons', 'Hàng hóa quá cảnh không bốc dỡ — Tấn')}
            {numberField('transitNoHandlingTeus', 'Hàng hóa quá cảnh không bốc dỡ — Teus')}
          </Row>

          {sectionDivider('Phân loại hàng hóa chi tiết')}
          <Row gutter={16}>
            {textField('cargoGroup', 'Nhóm hàng')}
            {textField('cargoType', 'Loại hàng')}
            {textField('cargoName', 'Tên hàng')}
          </Row>

          {sectionDivider('Cảng đi / đến')}
          <Row gutter={16}>
            {textField('lastPortOfCall', 'Cảng xếp dỡ cuối cùng')}
            {textField('arrivalPortName', 'Cảng đến')}
            {textField('arrivalPortCode', 'Mã cảng đến')}
            {textField('departurePortName', 'Cảng đi')}
            {textField('departurePortCode', 'Mã cảng đi')}
            {textField('destinationPort', 'Cảng đích')}
          </Row>

          {sectionDivider('Ngày tháng')}
          <Row gutter={16}>
            {dateField('arrivalDate', 'Ngày đến cảng')}
            {dateField('departureDate', 'Ngày rời cảng')}
          </Row>

          {sectionDivider('Thông tin khác')}
          <Row gutter={16}>
            {yesNoField('islandRoute', 'Tuyến từ bờ ra đảo')}
            {yesNoField('dangerousGoods', 'Hàng nguy hiểm')}
            {textField('shipAgent', 'Đại lý tàu biển')}
            {textField('enterpriseCode', 'Mã doanh nghiệp')}
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
