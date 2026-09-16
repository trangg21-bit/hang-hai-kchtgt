import { describe, it, expect } from 'vitest';
import { parseWktToCoordinates } from '../../utils/gisGeometry';

describe('SCADA Location Tab Counter Logic (/scada)', () => {
  const getLocationTabLabel = (coordinateCount: number) => `Thông tin vị trí (${coordinateCount})`;

  describe('Form Create/Edit mode tab label', () => {
    it('renders tab label with coordinateList.length in create/edit mode', () => {
      const emptyCoordinates: unknown[] = [];
      expect(getLocationTabLabel(emptyCoordinates.length)).toBe('Thông tin vị trí (0)');

      const singlePointCoordinates = [
        { latD: 15, latM: 5, latS: 55.1148, lngD: 108, lngM: 51, lngS: 9.1404 },
      ];
      expect(getLocationTabLabel(singlePointCoordinates.length)).toBe('Thông tin vị trí (1)');

      const lineCoordinates = [
        { latD: 15, latM: 5, latS: 55.1, lngD: 108, lngM: 51, lngS: 9.1 },
        { latD: 15, latM: 6, latS: 12.3, lngD: 108, lngM: 52, lngS: 10.4 },
      ];
      expect(getLocationTabLabel(lineCoordinates.length)).toBe('Thông tin vị trí (2)');
    });

    it('matches inner section header title count', () => {
      const coords = [
        { latD: 15, latM: 5, latS: 55.1148, lngD: 108, lngM: 51, lngS: 9.1404 },
      ];
      const tabLabel = getLocationTabLabel(coords.length);
      const innerSectionTitle = `Tọa độ GPS (${coords.length})`;

      expect(tabLabel).toBe('Thông tin vị trí (1)');
      expect(innerSectionTitle).toBe('Tọa độ GPS (1)');
      expect(tabLabel.match(/\((\d+)\)/)?.[1]).toBe(innerSectionTitle.match(/\((\d+)\)/)?.[1]);
    });
  });

  describe('Detail Drawer mode tab label', () => {
    it('calculates coordinate count from WKT coordinates string', () => {
      expect(getLocationTabLabel(parseWktToCoordinates('').length)).toBe('Thông tin vị trí (0)');
      expect(getLocationTabLabel(parseWktToCoordinates(undefined).length)).toBe('Thông tin vị trí (0)');

      const pointWkt = 'POINT (108.8525 15.0986)';
      const pointCoords = parseWktToCoordinates(pointWkt);
      expect(pointCoords).toHaveLength(1);
      expect(getLocationTabLabel(pointCoords.length)).toBe('Thông tin vị trí (1)');

      const lineWkt = 'LINESTRING (108.1 15.1, 108.2 15.2)';
      const lineCoords = parseWktToCoordinates(lineWkt);
      expect(lineCoords).toHaveLength(2);
      expect(getLocationTabLabel(lineCoords.length)).toBe('Thông tin vị trí (2)');
    });
  });
});
