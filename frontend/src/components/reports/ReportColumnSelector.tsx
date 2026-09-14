import React from 'react';
import { Popover, Button, Checkbox, Space, Typography, Tooltip } from 'antd';
import {
  SettingOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import {
  actionPrimary,
  textPrimary,
  textSecondary,
  spaceSm,
  spaceMd,
  radiusSm,
  borderDefault,
} from '../../tokens';

const { Text, Link } = Typography;

export interface ColumnItem {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

export interface ReportColumnSelectorProps {
  columns: ColumnItem[];
  visibleKeys: string[];
  columnOrder: string[];
  showStt: boolean;
  onShowSttChange: (show: boolean) => void;
  onChange: (visibleKeys: string[], columnOrder: string[]) => void;
  onReset: () => void;
}

export const ReportColumnSelector: React.FC<ReportColumnSelectorProps> = ({
  columns,
  visibleKeys,
  columnOrder,
  showStt,
  onShowSttChange,
  onChange,
  onReset,
}) => {
  // Sort columns according to columnOrder
  const orderedColumns = React.useMemo(() => {
    const list = [...columns];
    list.sort((a, b) => {
      const idxA = columnOrder.indexOf(a.key);
      const idxB = columnOrder.indexOf(b.key);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return list;
  }, [columns, columnOrder]);

  const allSelected = columns.length > 0 && visibleKeys.length === columns.length;
  const indeterminate = visibleKeys.length > 0 && visibleKeys.length < columns.length;

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      onChange(columns.map((c) => c.key), columnOrder);
    } else {
      onChange([], columnOrder);
    }
  };

  const handleToggleColumn = (key: string, checked: boolean) => {
    let nextVisibleKeys: string[];
    if (checked) {
      nextVisibleKeys = [...visibleKeys, key];
    } else {
      nextVisibleKeys = visibleKeys.filter((k) => k !== key);
    }
    onChange(nextVisibleKeys, columnOrder);
  };

  const handleMove = (key: string, direction: 'left' | 'right') => {
    const currentIndex = columnOrder.indexOf(key);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= columnOrder.length) return;

    const nextOrder = [...columnOrder];
    const temp = nextOrder[currentIndex];
    nextOrder[currentIndex] = nextOrder[targetIndex];
    nextOrder[targetIndex] = temp;

    onChange(visibleKeys, nextOrder);
  };

  const popoverContent = (
    <div style={{ width: 290, padding: `${spaceSm}px 0` }}>
      {/* Top action row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: spaceSm,
          borderBottom: `1px solid ${borderDefault}`,
          marginBottom: spaceSm,
        }}
      >
        <Space size="middle">
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={(e) => handleToggleAll(e.target.checked)}
          >
            <Text style={{ fontSize: 13, fontWeight: 500 }}>Ẩn hiện các cột</Text>
          </Checkbox>

          <Checkbox
            checked={showStt}
            onChange={(e) => onShowSttChange(e.target.checked)}
          >
            <Text style={{ fontSize: 13, fontWeight: 500 }}>Ẩn hiện STT</Text>
          </Checkbox>
        </Space>

        <Link
          onClick={onReset}
          style={{ fontSize: 13, color: actionPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Thiết lập lại
        </Link>
      </div>

      {/* Column items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {orderedColumns.map((col, index) => {
          const isChecked = visibleKeys.includes(col.key);
          const canMoveLeft = index > 0;
          const canMoveRight = index < orderedColumns.length - 1;

          return (
            <div
              key={col.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
                borderRadius: radiusSm,
                transition: 'background 0.2s ease',
              }}
              className="report-column-item"
            >
              <Checkbox
                checked={isChecked}
                onChange={(e) => handleToggleColumn(col.key, e.target.checked)}
                style={{ flex: 1 }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: isChecked ? textPrimary : textSecondary,
                    fontWeight: isChecked ? 500 : 400,
                  }}
                >
                  {col.label}
                </span>
              </Checkbox>

              <Space size={4}>
                <Tooltip title="Di chuyển lên / sang trái">
                  <Button
                    type="text"
                    size="small"
                    disabled={!canMoveLeft}
                    icon={<ArrowLeftOutlined style={{ fontSize: 12 }} />}
                    onClick={() => handleMove(col.key, 'left')}
                    style={{ width: 22, height: 22, padding: 0 }}
                  />
                </Tooltip>
                <Tooltip title="Di chuyển xuống / sang phải">
                  <Button
                    type="text"
                    size="small"
                    disabled={!canMoveRight}
                    icon={<ArrowRightOutlined style={{ fontSize: 12 }} />}
                    onClick={() => handleMove(col.key, 'right')}
                    style={{ width: 22, height: 22, padding: 0 }}
                  />
                </Tooltip>
              </Space>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      placement="bottomLeft"
      arrow={false}
      styles={{ body: { padding: `${spaceSm}px ${spaceMd}px` } }}
    >
      <Button
        icon={<SettingOutlined />}
        style={{
          borderRadius: radiusSm,
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 500,
        }}
      >
        Chọn chỉ tiêu
      </Button>
    </Popover>
  );
};

export default ReportColumnSelector;
