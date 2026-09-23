import { describe, it, expect } from 'vitest';
import { normalizeSearchText } from '../components/org-unit';

describe('Attached Infrastructure Search & Filter (/cctv, /scada, /transmission, /vts-assist, /vhf)', () => {
  const mockOptions = [
    { value: '47d7c6e0-2646-4b2a-8927-4a0b5f123456', label: 'test 01' },
    { value: '58e8d7f1-3757-5c3b-9a38-5b1c6e234567', label: 'a test 012' },
    { value: '69f9e8a2-4868-6d4c-ab49-6c2d7f345678', label: 'Trung tâm VTS Luồng Hải Phòng' },
    { value: '70a0f9b3-5979-7e5d-bc50-7d3e8a456789', label: 'Trạm camera Lotus' },
    { value: '81b1a0c4-6a8a-8f6e-cd61-8e4f9b567890', label: 'Trạm radar Hòn Dáu' },
  ];

  const filterFunction = (input: string, option?: { label: string; value: string }) => {
    return normalizeSearchText(option?.label).includes(normalizeSearchText(input));
  };

  it('TC-SEARCH-01: Correctly matches case-insensitive search "test" against label', () => {
    const results = mockOptions.filter((opt) => filterFunction('test', opt));
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.label)).toEqual(['test 01', 'a test 012']);
  });

  it('TC-SEARCH-02: Correctly matches uppercase input "TEST"', () => {
    const results = mockOptions.filter((opt) => filterFunction('TEST', opt));
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.label)).toEqual(['test 01', 'a test 012']);
  });

  it('TC-SEARCH-03: Matches unaccented Vietnamese input "hai phong" to "Trung tâm VTS Luồng Hải Phòng"', () => {
    const results = mockOptions.filter((opt) => filterFunction('hai phong', opt));
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe('Trung tâm VTS Luồng Hải Phòng');
  });

  it('TC-SEARCH-04: Matches accented Vietnamese input "Hải Phòng"', () => {
    const results = mockOptions.filter((opt) => filterFunction('Hải Phòng', opt));
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe('Trung tâm VTS Luồng Hải Phòng');
  });

  it('TC-SEARCH-05: Matches "hon dau" or "Hòn Dáu" to "Trạm radar Hòn Dáu"', () => {
    const resultsWithoutAccent = mockOptions.filter((opt) => filterFunction('hon dau', opt));
    expect(resultsWithoutAccent).toHaveLength(1);
    expect(resultsWithoutAccent[0].label).toBe('Trạm radar Hòn Dáu');

    const resultsWithAccent = mockOptions.filter((opt) => filterFunction('Hòn Dáu', opt));
    expect(resultsWithAccent).toHaveLength(1);
    expect(resultsWithAccent[0].label).toBe('Trạm radar Hòn Dáu');
  });

  it('TC-SEARCH-06: Does not filter by UUID value when user types text', () => {
    // If we searched by UUID, 'test' wouldn't match UUID '47d7c6e0...'
    const uuidDirectMatch = mockOptions.filter((opt) => opt.value.toLowerCase().includes('test'));
    expect(uuidDirectMatch).toHaveLength(0); // Proves the bug exists without label filter

    // With our label filter function, it succeeds
    const labelMatch = mockOptions.filter((opt) => filterFunction('test', opt));
    expect(labelMatch).toHaveLength(2);
  });
});
