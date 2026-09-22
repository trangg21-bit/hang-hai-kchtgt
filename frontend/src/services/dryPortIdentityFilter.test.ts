import { describe, expect, it } from 'vitest';
import { normalizeDryPortIdentityFilters } from '../pages/port/dry-port/api';

describe('dry port identity filters', () => {
  it('keeps name and code as independent AND filters', () => {
    expect(normalizeDryPortIdentityFilters('  bắc  ', '  13  ')).toEqual({
      name: 'bắc',
      code: '13',
    });
  });

  it('does not turn the name-only field into the broad search parameter', () => {
    const filters = normalizeDryPortIdentityFilters('Bắc', undefined);

    expect(filters).toEqual({ name: 'Bắc', code: undefined });
    expect(filters).not.toHaveProperty('search');
  });
});
