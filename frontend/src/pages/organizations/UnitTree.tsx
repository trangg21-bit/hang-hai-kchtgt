import { useState, useCallback, useEffect } from 'react';
import { Card, Tree, Typography, Button, Space, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { DataNode } from 'antd/es/tree';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import dayjs from 'dayjs';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: 'Bản nháp' },
  pending: { color: 'orange', label: 'Chờ duyệt' },
  approved: { color: 'green', label: 'Đã phê duyệt' },
  rejected: { color: 'red', label: 'Bị từ chối' },
};

interface OrgTreeNode extends DataNode {
  key: string;
  title: React.ReactNode;
  isLeaf?: boolean;
  children?: OrgTreeNode[];
}

function buildTree(orgs: Organization[], parentId?: string): OrgTreeNode[] {
  return orgs
    .filter((o) => parentId ? o.parentId === parentId : !o.parentId)
    .map((org) => ({
      key: org.id,
      title: (
        <Space>
          <Typography.Text strong>{org.name}</Typography.Text>
          <Tag color="blue">C{org.level}</Tag>
          <Tag color={STATUS_MAP[org.status]?.color || 'default'}>
            {STATUS_MAP[org.status]?.label || org.status}
          </Tag>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {org.childCount} đơn vị con
          </Typography.Text>
        </Space>
      ),
      isLeaf: org.childCount === 0,
      children: buildTree(orgs, org.id),
    }));
}

export default function UnitTree() {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState<OrgTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTree = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const orgs = await organizationService.getTree();
      setDataSource(buildTree(orgs));
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải cây đơn vị'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadTree(); }, []);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/organizations')}>
            Quay lại
          </Button>
          <Typography.Title level={5} style={{ margin: 0 }}>Cây cấu trúc đơn vị</Typography.Title>
        </Space>
      </Card>

      <Card>
        {isLoading && <LoadingSkeleton rows={10} type="card" />}
        {isError && (
          <ErrorState
            message={error?.message || 'Không thể tải cây đơn vị'}
            onRetry={loadTree}
          />
        )}
        {!isLoading && !isError && dataSource.length === 0 && (
          <EmptyState description="Chưa có đơn vị nào trong hệ thống" />
        )}
        {!isLoading && !isError && dataSource.length > 0 && (
          <Tree
            treeData={dataSource}
            defaultExpandedAll
            showLine
            showIcon={false}
          />
        )}
      </Card>
    </>
  );
}
