import { describe, it, expect } from 'vitest';
import {
  parseMaritimeServiceTokens,
  resolveMaritimeServiceLabel,
  formatMaritimeServicesDisplay,
} from '../constants/maritimeServices';

describe('maritimeServices parsing and display tests', () => {
  it('should not split Vietnamese sentences into single words even when containing capitalized keywords like INMARSAT', () => {
    const input = 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)';
    const tokens = parseMaritimeServiceTokens(input);
    expect(tokens).toEqual([input]);
    const label = resolveMaritimeServiceLabel(tokens[0]);
    expect(label).toBe(input);
  });

  it('should correctly parse multiline Vietnamese service strings', () => {
    const s1 = 'Dịch vụ trực canh cấp cứu INMARSAT (INMARSAT CospasSarsat Distress Watch-keeping Service)';
    const s2 = 'Dịch vụ cấp cứu DSC (DSC Distress Service)';
    const multiline = `${s1}\n${s2}`;
    const tokens = parseMaritimeServiceTokens(multiline);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toBe(s1);
    expect(tokens[1]).toBe(s2);
  });

  it('should split uppercase enum codes separated by spaces', () => {
    const input = 'INMARSAT_DISTRESS COSPAS_SARSAT_DISTRESS';
    const tokens = parseMaritimeServiceTokens(input);
    expect(tokens).toEqual(['INMARSAT_DISTRESS', 'COSPAS_SARSAT_DISTRESS']);
    expect(resolveMaritimeServiceLabel(tokens[0])).toContain('INMARSAT');
  });

  it('should handle JSON string array properly', () => {
    const input = JSON.stringify(['INMARSAT_DISTRESS', 'COSPAS_SARSAT_DISTRESS']);
    const tokens = parseMaritimeServiceTokens(input);
    expect(tokens).toEqual(['INMARSAT_DISTRESS', 'COSPAS_SARSAT_DISTRESS']);
  });

  it('should format services with formatMaritimeServicesDisplay cleanly', () => {
    const input = 'INMARSAT_DISTRESS, COSPAS_SARSAT_DISTRESS';
    const result = formatMaritimeServicesDisplay(input);
    expect(result).toContain('Dịch vụ');
    expect(result.split('\n')).toHaveLength(2);
  });
});
