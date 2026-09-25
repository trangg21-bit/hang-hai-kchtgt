import { describe, it, expect } from 'vitest';
import { buildOrgUnitTreeData, type OrgUnitTreeOption } from '../../components/org-unit/orgUnitHelpers';

describe('NavigationChannelForm — Đơn vị quản lý hiển thị format Mã - Tên (/navigation-channel)', () => {
  const mockOrganizations: OrgUnitTreeOption[] = [
    {
      id: '00000000-0000-0000-0000-000000000043',
      code: 'G17.43',
      name: 'Cục Hàng hải và Đường thủy Việt Nam',
      parentId: undefined,
    },
    {
      id: '00000000-0000-0000-0000-000000000008',
      code: 'G17.43.08',
      name: 'Cảng vụ hàng hải Hà Tĩnh',
      parentId: '00000000-0000-0000-0000-000000000043',
    },
    {
      id: '00000000-0000-0000-0000-000000000026',
      code: 'G17.43.26',
      name: 'Trường Cao đẳng Hàng hải I',
      parentId: '00000000-0000-0000-0000-000000000043',
    },
    {
      id: '00000000-0000-0000-0000-000000000099',
      name: 'Đơn vị không có mã',
      parentId: '00000000-0000-0000-0000-000000000043',
    },
  ];

  it('TC-ORG-01: buildOrgUnitTreeData tạo node với title và label theo format Mã - Tên (ví dụ: G17.43 - Cục Hàng hải...)', () => {
    const tree = buildOrgUnitTreeData(mockOrganizations);
    expect(tree.length).toBe(1);

    const rootNode = tree[0];
    expect(rootNode.value).toBe('00000000-0000-0000-0000-000000000043');
    expect(rootNode.title).toBe('G17.43 - Cục Hàng hải và Đường thủy Việt Nam');
    expect(rootNode.label).toBe('G17.43 - Cục Hàng hải và Đường thủy Việt Nam');

    const children = rootNode.children || [];
    expect(children.length).toBe(3);

    const childWithCode = children.find((c) => c.value === '00000000-0000-0000-0000-000000000008');
    expect(childWithCode?.title).toBe('G17.43.08 - Cảng vụ hàng hải Hà Tĩnh');
    expect(childWithCode?.label).toBe('G17.43.08 - Cảng vụ hàng hải Hà Tĩnh');

    const childWithoutCode = children.find((c) => c.value === '00000000-0000-0000-0000-000000000099');
    expect(childWithoutCode?.title).toBe('Đơn vị không có mã');
    expect(childWithoutCode?.label).toBe('Đơn vị không có mã');
  });

  it('TC-ORG-02: Ẩn đơn vị gốc G17 (Bộ GTVT) khỏi cây dropdown chọn Đơn vị quản lý', () => {
    const orgsWithG17: OrgUnitTreeOption[] = [
      {
        id: '00000000-0000-0000-0000-000000000017',
        code: 'G17',
        name: 'Bộ Giao thông Vận tải',
      },
      ...mockOrganizations,
    ];
    const tree = buildOrgUnitTreeData(orgsWithG17);
    expect(tree.some((n) => n.code === 'G17' || n.value === '00000000-0000-0000-0000-000000000017')).toBe(false);
  });
});
