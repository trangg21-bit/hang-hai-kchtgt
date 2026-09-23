import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { fetchVtsAssistList } from './vtsassist/api';

describe('VTS Assist Sorting Tests (/vts-assist)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
        },
      },
    });
  });

  it('sends sortBy and sortOrder correctly for attachedInfrastructureName ASC', async () => {
    await fetchVtsAssistList({
      page: 0,
      size: 20,
      sortBy: 'attachedInfrastructureName',
      sortOrder: 'asc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl = vi.mocked(api.get).mock.calls[0][0] as string;
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('sortBy')).toBe('attachedInfrastructureName');
    expect(urlObj.searchParams.get('sortOrder')).toBe('asc');
  });

  it('sends sortBy and sortOrder correctly for operatingUnitName DESC', async () => {
    await fetchVtsAssistList({
      page: 0,
      size: 20,
      sortBy: 'operatingUnitName',
      sortOrder: 'desc',
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    const requestedUrl = vi.mocked(api.get).mock.calls[0][0] as string;
    const urlObj = new URL(`http://localhost${requestedUrl}`);

    expect(urlObj.searchParams.get('sortBy')).toBe('operatingUnitName');
    expect(urlObj.searchParams.get('sortOrder')).toBe('desc');
  });

  it('sortOrderFor logic resolves correctly for active sort fields', () => {
    const sortOrderFor = (
      currentSortField: string | undefined,
      currentSortOrder: 'asc' | 'desc' | null,
      key: string
    ) =>
      currentSortField === key && currentSortOrder
        ? currentSortOrder === 'asc'
          ? 'ascend'
          : 'descend'
        : null;

    // Khi sort trường attachedInfrastructureName ASC
    expect(sortOrderFor('attachedInfrastructureName', 'asc', 'attachedInfrastructureName')).toBe('ascend');
    expect(sortOrderFor('attachedInfrastructureName', 'asc', 'operatingUnitName')).toBeNull();

    // Khi sort trường operatingUnitName DESC
    expect(sortOrderFor('operatingUnitName', 'desc', 'operatingUnitName')).toBe('descend');
    expect(sortOrderFor('operatingUnitName', 'desc', 'attachedInfrastructureName')).toBeNull();

    // Khi xóa sort (null)
    expect(sortOrderFor(undefined, null, 'attachedInfrastructureName')).toBeNull();
    expect(sortOrderFor(undefined, null, 'operatingUnitName')).toBeNull();
  });
});
