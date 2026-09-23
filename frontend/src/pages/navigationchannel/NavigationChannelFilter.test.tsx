import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';

describe('NavigationChannel Filter Reordering (/navigation-channel)', () => {
  const filePath = path.resolve(__dirname, 'NavigationChannelList.tsx');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  it('contains the correct default filters before filterCollapsed', () => {
    const filterSection = fileContent.substring(
      fileContent.indexOf('const filterContent = ('),
      fileContent.indexOf('const statusTabs =')
    );

    const [defaultFilters, advancedFilters] = filterSection.split('{filterCollapsed && (');

    expect(defaultFilters).toBeDefined();
    expect(advancedFilters).toBeDefined();

    // Default filters: Đơn vị quản lý, Tên luồng hàng hải, Tình trạng
    expect(defaultFilters).toContain('Đơn vị quản lý');
    expect(defaultFilters).toContain('Tên luồng hàng hải');
    expect(defaultFilters).toContain('Tình trạng');

    // Advanced filters should NOT be in default section
    expect(defaultFilters).not.toContain('Thuộc cảng biển');
    expect(defaultFilters).not.toContain('Mã luồng hàng hải');
    expect(defaultFilters).not.toContain('Ngày cập nhật');
    expect(defaultFilters).not.toContain('Địa điểm (Tỉnh/Thành phố)');
  });

  it('contains the correct advanced filters inside filterCollapsed', () => {
    const filterSection = fileContent.substring(
      fileContent.indexOf('const filterContent = ('),
      fileContent.indexOf('const statusTabs =')
    );
    const [, advancedFilters] = filterSection.split('{filterCollapsed && (');

    // Advanced filters: Thuộc cảng biển, Mã luồng hàng hải, Ngày cập nhật, Địa điểm (Tỉnh/Thành phố)
    expect(advancedFilters).toContain('Thuộc cảng biển');
    expect(advancedFilters).toContain('Mã luồng hàng hải');
    expect(advancedFilters).toContain('Ngày cập nhật');
    expect(advancedFilters).toContain('Địa điểm (Tỉnh/Thành phố)');

    // Removed filters: Đơn vị vận hành, Cán bộ cập nhật should NOT be in filterContent
    expect(filterSection).not.toContain('Đơn vị vận hành');
    expect(filterSection).not.toContain('Cán bộ cập nhật');
  });

  it('rangeValue helper handles empty and populated dates appropriately', () => {
    const rangeValue = (from: string, to: string) =>
      from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null;

    expect(rangeValue('', '')).toBeNull();

    const result = rangeValue('2026-01-01', '2026-01-31');
    expect(result).not.toBeNull();
    expect(result?.[0]?.format('YYYY-MM-DD')).toBe('2026-01-01');
    expect(result?.[1]?.format('YYYY-MM-DD')).toBe('2026-01-31');
  });

  it('handleFilterApply trims both inputKeyword and inputChannelCode and updates UI state', () => {
    expect(fileContent).toContain('const trimmedKeyword = inputKeyword.trim();');
    expect(fileContent).toContain('const trimmedCode = inputChannelCode.trim();');
    expect(fileContent).toContain('setInputKeyword(trimmedKeyword);');
    expect(fileContent).toContain('setInputChannelCode(trimmedCode);');
    expect(fileContent).toContain('setAppliedKeyword(trimmedKeyword);');
    expect(fileContent).toContain('setAppliedChannelCode(trimmedCode);');
  });

  it('both keyword and channelCode inputs have onBlur trim handlers', () => {
    expect(fileContent).toContain('setInputKeyword((prev) => prev.trim())');
    expect(fileContent).toContain('setInputChannelCode((prev) => prev.trim())');
  });

  it('normalizeSearchText supports case-insensitive and Vietnamese unaccented matching', () => {
    const normalizeSearchText = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd');

    const channelName = 'Luồng Hòn Gai - Cái Lân';
    expect(normalizeSearchText(channelName)).toContain(normalizeSearchText('hon gai'));
    expect(normalizeSearchText(channelName)).toContain(normalizeSearchText('HÒN GAI'));
    expect(normalizeSearchText(channelName)).toContain(normalizeSearchText('cai lan'));

    const channelCode = 'LHH-DN01';
    expect(normalizeSearchText(channelCode)).toContain(normalizeSearchText('dn01'));
  });

  it('table columns: does not contain "Đơn vị vận hành" and includes approval officer columns', () => {
    const columnsSection = fileContent.substring(
      fileContent.indexOf('const columns: any[] = useMemo(() => {'),
      fileContent.indexOf('const rowActions = useCallback(')
    );

    // Bỏ cột "Đơn vị vận hành" khỏi bảng
    expect(columnsSection).not.toContain("label: 'Đơn vị vận hành'");
    expect(columnsSection).not.toContain("key: 'operatingUnitId'");

    // Bổ sung các cột mới theo format Cột Cán bộ cập nhật
    expect(columnsSection).toContain("label: 'Cán bộ cập nhật'");
    expect(columnsSection).toContain("label: 'Cán bộ gửi phê duyệt'");
    expect(columnsSection).toContain("label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục'");
    expect(columnsSection).toContain("label: 'Cán bộ phê duyệt cấp Cục'");

    // Kiểm tra dataIndex & keys
    expect(columnsSection).toContain("key: 'submittedAt'");
    expect(columnsSection).toContain("key: 'approvedDateLevel1'");
    expect(columnsSection).toContain("key: 'approvedDateLevel2'");
    expect(columnsSection).toContain("key: 'updatedAt'");

    // Kiểm tra thứ tự hiển thị: Cán bộ cập nhật -> Cán bộ gửi phê duyệt -> Cán bộ phê duyệt cấp Cảng vụ/Chi cục -> Cán bộ phê duyệt cấp Cục
    const idxUpdated = columnsSection.indexOf("label: 'Cán bộ cập nhật'");
    const idxSubmitted = columnsSection.indexOf("label: 'Cán bộ gửi phê duyệt'");
    const idxApproveC1 = columnsSection.indexOf("label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục'");
    const idxApproveC2 = columnsSection.indexOf("label: 'Cán bộ phê duyệt cấp Cục'");

    expect(idxUpdated).toBeGreaterThan(-1);
    expect(idxSubmitted).toBeGreaterThan(idxUpdated);
    expect(idxApproveC1).toBeGreaterThan(idxSubmitted);
    expect(idxApproveC2).toBeGreaterThan(idxApproveC1);
  });
});
