import { useState, useMemo } from 'react';
import { Card, Input, Space, Tag, Typography, Empty, Tree, type TreeDataNode, type TreeProps } from 'antd';
import { SearchOutlined, FileTextOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  actionPrimary,
  statusOperational,
  spaceMd, spaceLg, spaceXxl,
  fontSizeLg,
  fontWeightBold,
} from '../../tokens';

import {
  REPORT_TEMPLATES,
  CATEGORY_MAP,
  type ReportTemplate,
} from '../../config/reports';
import { CATEGORY_ICONS, REPORT_ICONS } from '../../config/reportIcons';

export { REPORT_TEMPLATES, CATEGORY_MAP, type ReportTemplate };

export default function ReportList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const filteredReports = useMemo(() => {
    if (!search.trim()) return REPORT_TEMPLATES;
    const lower = search.toLowerCase();
    return REPORT_TEMPLATES.filter(
      (r) => r.code.toLowerCase().includes(lower) || r.name.toLowerCase().includes(lower)
    );
  }, [search]);

  // Group by category and build tree data
  const treeData = useMemo(() => {
    const data: TreeDataNode[] = [];
    Object.entries(CATEGORY_MAP).forEach(([key, info]) => {
      const isImplemented = key === 'bckcht' || key === 'bcdl';
      const list = filteredReports.filter((r) => r.category === key);
      if (list.length > 0) {
        data.push({
          title: (
            <Space style={{ padding: '4px 0' }}>
              <Typography.Text strong style={{ fontSize: fontSizeLg, color: !isImplemented ? '#8c8c8c' : undefined }}>{info.label}</Typography.Text>
              <Tag color={isImplemented ? info.color : 'default'} style={{ margin: 0 }}>{list.length} biểu mẫu</Tag>
              {!isImplemented && <Tag style={{ margin: 0 }}>Chưa triển khai</Tag>}
            </Space>
          ),
          key: key,
          disabled: !isImplemented,
          icon: CATEGORY_ICONS[key] ? (
            <span style={{ color: isImplemented ? actionPrimary : '#bfbfbf', fontSize: 16 }}>{CATEGORY_ICONS[key]}</span>
          ) : ({ expanded }: { expanded: boolean }) =>
            expanded ? (
              <FolderOpenOutlined style={{ color: isImplemented ? actionPrimary : '#bfbfbf', fontSize: 16 }} />
            ) : (
              <FolderOutlined style={{ color: isImplemented ? actionPrimary : '#bfbfbf', fontSize: 16 }} />
            ),
          children: list.map((item) => {
            const itemActive = isImplemented && item.status === 'active';
            return {
              title: (
                <Space style={{ padding: '2px 0' }}>
                  <Typography.Text code style={{ color: itemActive ? actionPrimary : '#8c8c8c', fontWeight: fontWeightBold }}>{item.code}</Typography.Text>
                  <Typography.Text style={{ fontSize: 14, color: !itemActive ? '#8c8c8c' : undefined }}>{item.name}</Typography.Text>
                  {!itemActive && <Tag style={{ marginLeft: 8 }}>Chưa triển khai</Tag>}
                </Space>
              ),
              key: item.code,
              disabled: !itemActive,
              isLeaf: true,
              icon: REPORT_ICONS[item.code] ? (
                <span style={{ color: itemActive ? statusOperational : '#bfbfbf', fontSize: fontSizeLg }}>{REPORT_ICONS[item.code]}</span>
              ) : (
                <FileTextOutlined style={{ color: itemActive ? statusOperational : '#bfbfbf', fontSize: fontSizeLg }} />
              ),
            };
          }),
        });
      }
    });
    return data;
  }, [filteredReports]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setExpandedKeys(val.trim() ? Object.keys(CATEGORY_MAP) : []);
  };

  const onSelect: TreeProps['onSelect'] = (_selectedKeys, info) => {
    if (info.node.isLeaf) {
      navigate(`/reports/${info.node.key}`);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* Search Header */}
      <Card>
        <Typography.Title level={4} style={{ margin: 0, marginBottom: spaceMd }}>
          Danh mục biểu mẫu báo cáo & thống kê
        </Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: spaceMd }}>
          Hệ thống cung cấp {REPORT_TEMPLATES.length} mẫu biểu thống kê chuyên ngành theo Thông tư 48, Thông tư 67 và Nghị định 43.
        </Typography.Text>
        <Input
          placeholder="Tìm theo mã biểu (F-141) hoặc tên biểu mẫu báo cáo..."
          allowClear
          prefix={<SearchOutlined />}
          value={search}
          onChange={handleSearchChange}
          style={{ maxWidth: 500 }}
          size="large"
        />
      </Card>

      {/* Tree list catalog */}
      {treeData.length > 0 ? (
        <Card styles={{ body: { padding: `${spaceMd}px ${spaceLg}px` } }}>
          <Tree
            showIcon
            blockNode
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys)}
            onSelect={onSelect}
            treeData={treeData}
            style={{ fontSize: fontSizeLg }}
          />
        </Card>
      ) : (
        <Card style={{ textAlign: 'center', padding: `${spaceXxl}px 0` }}>
          <Empty description="Không tìm thấy biểu mẫu báo cáo nào khớp với từ khóa tìm kiếm" />
        </Card>
      )}
    </Space>
  );
}
