import { cangBienCRUD } from '../frontend/src/services/cangbenService';
import { describe, it, expect } from 'vitest';

describe('cangben service imports', () => {
  it('imports cangBienCRUD', () => {
    expect(cangBienCRUD).toBeDefined();
  });
});
