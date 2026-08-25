import { useState, useEffect } from 'react';
import { Button, Form, Input, InputNumber, Space, Table, Typography, Popconfirm } from 'antd';
import type { ColumnsType, PopconfirmProps } from 'antd/es/popconfirm';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import {
  fontSizeMd,
  fontWeightBold,
  colors,
  spaceMd,
  spaceFormField,
  spaceSm,
  radiusPill,
  actionPrimary,
  borderDefault,
} from '../tokens';

const { Text } = Typography;

export interface CoordinateRow {
  key: string;
  latitude: number | null;
  longitude: number | null;
  description?: string;
}

export interface LongLatTableProps {
  name?: string;
  value?: CoordinateRow[];
  onChange?: (value: CoordinateRow[] | undefined) => void;
  disabled?: boolean;
}

export const LongLatTable = ({
  name = 'coordinates',
  value = [],
  onChange,
  disabled = false,
}: LongLatTableProps) => {
  const [rows, setRows] = useState<CoordinateRow[]>(value);

  useEffect(() => {
    setRows(value);
  }, [value]);

  useEffect(() => {
    onChange?.(rows);
  }, [rows, onChange]);

  const addRow = () => {
    const newRow: CoordinateRow = {
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      latitude: null,
      longitude: null,
      description: '',
    };
    setRows((prev) => [...prev, newRow]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateRow = (key: string, field: keyof CoordinateRow, val: any) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: val } : r))
    );
  };

  const columns: ColumnsType<CoordinateRow> = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_, __, idx) => (
        <Text style={{ fontWeight: fontWeightBold }}>{idx + 1}</Text>
      ),
    },
    {
      title: 'Vĩ độ (Latitude)',
      dataIndex: 'latitude',
      key: 'latitude',
      width: 200,
      render: (val: number | null, record: CoordinateRow) => (
        <InputNumber
          style={{ width: '100%', borderRadius: radiusPill }}
          value={val}
          onChange={(v) => updateRow(record.key, 'latitude', v)}
          min={-90}
          max={90}
          step={0.000001}
          placeholder="VD: 20.860000"
          disabled={disabled}
        />
      ),
    },
    {
      title: 'Kinh độ (Longitude)',
      dataIndex: 'longitude',
      key: 'longitude',
      width: 200,
      render: (val: number | null, record: CoordinateRow) => (
        <InputNumber
          style={{ width: '100%', borderRadius: radiusPill }}
          value={val}
          onChange={(v) => updateRow(record.key, 'longitude', v)}
          min={-180}
          max={180}
          step={0.000001}
          placeholder="VD: 106.670000"
          disabled={disabled}
        />
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (val: string | undefined, record: CoordinateRow) => (
        <Input
          style={{ borderRadius: radiusPill }}
          value={val}
          onChange={(e) => updateRow(record.key, 'description', e.target.value)}
          placeholder="Mô tả tọa độ"
          disabled={disabled}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 80,
      render: (_, record: CoordinateRow) => (
        <Popconfirm
          title="Xóa"
          description="Bạn có chắc muốn xóa dòng này?"
          onConfirm={() => removeRow(record.key)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={disabled}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ marginTop: spaceMd }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spaceMd }}>
        <Text style={{ fontWeight: fontWeightBold, fontSize: fontSizeMd }}>
          Tọa độ (GIS)
        </Text>
        {!disabled && (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addRow}
            style={{ borderRadius: radiusPill }}
          >
            Thêm tọa độ
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="small"
        rowKey="key"
        style={{ borderRadius: radiusPill }}
      />
    </div>
  );
};

export default LongLatTable;
