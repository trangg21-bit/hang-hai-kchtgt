import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SHOW_PLANNING,
  GIS_LAYER_INTERACTION_POLICY,
  getMapClickResolution,
  getPlanningAciColor,
  getPlanningFeatureColor,
  getPlanningFeatureKey,
  getPlanningLeafletColorStyle,
  getPlanningStatusPresentation,
  getPlanningStyleZoomBand,
  getPlanningVisualStyle,
  PLANNING_STATUS_COLORS,
  shouldRenderPlanningFeature,
} from '../utils/planningGis';

describe('planningGis', () => {
  it('shows the port-planning layer by default', () => {
    expect(DEFAULT_SHOW_PLANNING).toBe(true);
  });

  it('uses panes only for drawing order while click priority stays centralized', () => {
    expect(GIS_LAYER_INTERACTION_POLICY).toEqual({
      kchtGeometryPane: 'overlayPane',
      planningPane: 'planningPane',
      planningPaneZIndex: 550,
      kchtMarkerPane: 'markerPane',
    });
  });

  it('opens a chooser whenever planning and KCHT overlap', () => {
    expect(getMapClickResolution(0, 0)).toBe('none');
    expect(getMapClickResolution(2, 0)).toBe('planning');
    expect(getMapClickResolution(0, 1)).toBe('kcht');
    expect(getMapClickResolution(0, 2)).toBe('choice');
    expect(getMapClickResolution(1, 1)).toBe('choice');
  });

  it('uses the same cache key for API and Leaflet geometry type casing', () => {
    expect(getPlanningFeatureKey(
      'AREA',
      'nam_dinh',
      'BenCangPhatTrienCoDieuKien_A',
      3,
    )).toBe('area:nam_dinh:BenCangPhatTrienCoDieuKien_A:3');

    expect(getPlanningFeatureKey(
      'area',
      'nam_dinh',
      'BenCangPhatTrienCoDieuKien_A',
      '3',
    )).toBe('area:nam_dinh:BenCangPhatTrienCoDieuKien_A:3');
  });

  it('maps updated planning color values from number or API string', () => {
    expect(getPlanningAciColor(1)).toBe('#ff4d4f');
    expect(getPlanningAciColor('3')).toBe('#52c41a');
    expect(getPlanningFeatureColor(
      'BenCangQuyHoachDenNam2050_A',
      'Bến cảng quy hoạch tầm nhìn đến năm 2050',
      181,
    )).toBe(PLANNING_STATUS_COLORS.vision2050);
    expect(getPlanningLeafletColorStyle(
      'AREA',
      1,
      'BenCangPhatTrienCoDieuKien_A',
      'Bến cảng phát triển có điều kiện',
    )).toEqual({
      color: PLANNING_STATUS_COLORS.conditionalDevelopment,
      fillColor: PLANNING_STATUS_COLORS.conditionalDevelopment,
    });
  });

  it('reduces visual density at overview zoom levels', () => {
    expect(getPlanningStyleZoomBand(8)).toBe(0);
    expect(getPlanningStyleZoomBand(11)).toBe(1);
    expect(getPlanningStyleZoomBand(13)).toBe(2);

    const overviewStyle = getPlanningVisualStyle(
      'AREA',
      'BenCangQuyHoachDenNam2030_A',
      'Bến cảng quy hoạch đến năm 2030',
      3,
      8,
    );
    const detailStyle = getPlanningVisualStyle(
      'AREA',
      'BenCangQuyHoachDenNam2030_A',
      'Bến cảng quy hoạch đến năm 2030',
      3,
      13,
    );

    expect(overviewStyle.fillOpacity).toBeLessThan(detailStyle.fillOpacity);
    expect(overviewStyle.weight).toBeLessThan(detailStyle.weight);
    expect(overviewStyle.opacity).toBe(1);
    expect(detailStyle.opacity).toBe(1);
    expect(detailStyle.fillOpacity).toBeGreaterThanOrEqual(0.9);
    expect(detailStyle.weight).toBeGreaterThanOrEqual(2);

    const detailLineStyle = getPlanningVisualStyle(
      'LINE',
      'RanhGioiVungNuocCangBien_L',
      'Quy hoạch',
      150,
      13,
    );
    expect(detailLineStyle.weight).toBeGreaterThanOrEqual(2);
    expect(detailLineStyle.opacity).toBe(1);
    expect(shouldRenderPlanningFeature('POINT', 'Ghichu_P', 11)).toBe(false);
    expect(shouldRenderPlanningFeature('POINT', 'Ghichu_P', 13)).toBe(true);
  });

  it('maps each planning structure to its own status catalogue', () => {
    const port = getPlanningStatusPresentation(
      'AREA',
      'BenCangQuyHoachDenNam2030_A',
      'Quy hoạch',
      3,
    );
    expect(port.kind).toBe('portPlanned2030');
    expect(port.label).toBe('Bến cảng quy hoạch đến năm 2030');
    expect(port.options).toHaveLength(4);

    const potentialPort = getPlanningStatusPresentation(
      'AREA',
      'BenCangKhac_A',
      'Bến cảng tiềm năng',
      7,
    );
    expect(potentialPort.kind).toBe('portVision2050');

    const waterArea = getPlanningStatusPresentation('AREA', 'Khac_A', 'Quy hoạch', 7);
    expect(waterArea.kind).toBe('genericPlanned');
    expect(waterArea.label).toBe('Quy hoạch');
    expect(waterArea.options.map((option) => option.label)).toContain('Quy hoạch sau năm 2030');

    const anchorage = getPlanningStatusPresentation('LINE', 'VungNeoHienTrang_L', 'Hiện trạng', 9);
    expect(anchorage.kind).toBe('anchorageExisting');
    expect(anchorage.options.map((option) => option.label)).toEqual([
      'Vùng neo hiện trạng',
      'Vùng neo quy hoạch',
    ]);

    const pilotArea = getPlanningStatusPresentation(
      'LINE',
      'VungDonTraHoaTieu_L',
      'Quy hoạch',
      6,
    );
    expect(pilotArea.kind).toBe('pilotPlanned');
    expect(pilotArea.options.map((option) => option.label)).toEqual([
      'Vùng đón trả hoa tiêu hiện trạng',
      'Vùng đón trả hoa tiêu quy hoạch',
    ]);
    expect(getPlanningStatusPresentation(
      'LINE',
      'VungDonTraHoaTieu_L',
      null,
      9,
    ).kind).toBe('pilotExisting');
  });

  it('does not show an editable status catalogue for labels and unrelated lines', () => {
    expect(getPlanningStatusPresentation('POINT', 'Ghichu_P', 'Quy hoạch', 7).options).toEqual([]);
    expect(getPlanningStatusPresentation('LINE', 'TimLuong_L', 'Quy hoạch', 1).options).toEqual([]);
  });
});
