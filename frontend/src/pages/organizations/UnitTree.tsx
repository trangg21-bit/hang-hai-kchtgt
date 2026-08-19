import { useState, useCallback, useEffect } from 'react';
import { Tree, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { organizationService } from '../../services/organizationService';
import type { Organization } from '../../services/organizationService';
import { ScreenHeader } from '../../components/list-view';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { cardStyle, dataSea1, fontSizeMd, fontWeightMedium } from '../../tokens';

interface OrgTreeNode {
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
          <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 8, fontSize: fontSizeMd, fontWeight: fontWeightMedium, background: `${dataSea1}15`, color: dataSea1 }}>C{org.level}</span>
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
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void loadTree(); }, []);

  return (
    <div style={{ minHeight: '100%', marginTop: -8 }}>
      <ScreenHeader
        breadcrumb={[
          { label: 'Quản trị hệ thống' },
          { label: 'Quản lý đơn vị', path: '/organizations' },
          { label: 'Cây cấu trúc đơn vị' },
        ]}
        actions={[]}
      />
      <div style={{ ...cardStyle, padding: '8px 16px' }}>
        {isLoading && <LoadingSkeleton rows={10} type="card" />}
        {isError && <ErrorState message={error?.message || 'Không thể tải cây đơn vị'} onRetry={loadTree} />}
        {!isLoading && !isError && dataSource.length === 0 && <EmptyState description="Chưa có đơn vị nào trong hệ thống" />}
        {!isLoading && !isError && dataSource.length > 0 && (
          <Tree treeData={dataSource} defaultExpandedAll showLine showIcon={false} />
        )}
      </div>
    </div>
  );
}
