export const DEFAULT_SHOW_PLANNING = true;

export const PLANNING_STATUS_COLORS = {
  existingPort: '#d49400',
  planned2030: '#2f9e44',
  conditionalDevelopment: '#d95c59',
  vision2050: '#7656b5',
  existingAnchorage: '#66788a',
  plannedAnchorage: '#d9822b',
  existingPilotArea: '#c35b9d',
  plannedPilotArea: '#a63bb8',
  waterBoundary: '#2a78d6',
  channelCenterline: '#d95c59',
  fallback: '#3978a8',
} as const;

export const getPlanningFeatureKey = (
  geometryType: unknown,
  schemaName: unknown,
  tableName: unknown,
  fid: unknown,
): string => [
  String(geometryType ?? '').trim().toLowerCase(),
  String(schemaName ?? '').trim(),
  String(tableName ?? '').trim(),
  String(fid ?? '').trim(),
].join(':');

// AutoCAD Color Index used by the imported port-planning GIS dataset.
const PLANNING_ACI_COLORS: Record<number, string> = {
  1: '#ff4d4f',
  2: '#faad14',
  3: '#52c41a',
  4: '#13c2c2',
  5: '#2f54eb',
  6: '#eb2f96',
  7: '#722ed1',
  8: '#595959',
  9: '#8c8c8c',
  10: '#d9d9d9',
  11: PLANNING_STATUS_COLORS.conditionalDevelopment,
  30: '#d9822b',
  150: PLANNING_STATUS_COLORS.waterBoundary,
  181: PLANNING_STATUS_COLORS.vision2050,
  211: PLANNING_STATUS_COLORS.existingPilotArea,
  221: PLANNING_STATUS_COLORS.existingPilotArea,
};

export const getPlanningAciColor = (colorIndex: unknown): string => {
  const normalizedIndex = Number(colorIndex);
  return PLANNING_ACI_COLORS[normalizedIndex] || PLANNING_STATUS_COLORS.fallback;
};

const normalizePlanningText = (value: unknown): string => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .trim()
  .toLowerCase();

export type PlanningStatusKind =
  | 'portExisting'
  | 'portPlanned2030'
  | 'portConditional'
  | 'portVision2050'
  | 'anchorageExisting'
  | 'anchoragePlanned'
  | 'pilotExisting'
  | 'pilotPlanned'
  | 'genericExisting'
  | 'genericPlanned'
  | 'genericPlanned2030'
  | 'genericAfter2030'
  | 'genericVision2050'
  | 'unknown';

export interface PlanningStatusOption {
  kind: PlanningStatusKind;
  label: string;
  status: string;
  color: number;
  swatchColor: string;
}

export interface PlanningStatusPresentation {
  kind: PlanningStatusKind;
  label: string;
  swatchColor: string;
  options: PlanningStatusOption[];
}

const PORT_STATUS_OPTIONS: PlanningStatusOption[] = [
  {
    kind: 'portExisting',
    label: 'Bến cảng hiện hữu',
    status: 'Bến cảng hiện hữu',
    color: 2,
    swatchColor: PLANNING_STATUS_COLORS.existingPort,
  },
  {
    kind: 'portPlanned2030',
    label: 'Bến cảng quy hoạch đến năm 2030',
    status: 'Bến cảng quy hoạch đến năm 2030',
    color: 3,
    swatchColor: PLANNING_STATUS_COLORS.planned2030,
  },
  {
    kind: 'portConditional',
    label: 'Bến cảng phát triển có điều kiện',
    status: 'Bến cảng phát triển có điều kiện',
    color: 1,
    swatchColor: PLANNING_STATUS_COLORS.conditionalDevelopment,
  },
  {
    kind: 'portVision2050',
    label: 'Bến cảng quy hoạch tầm nhìn đến năm 2050',
    status: 'Bến cảng quy hoạch tầm nhìn đến năm 2050',
    color: 7,
    swatchColor: PLANNING_STATUS_COLORS.vision2050,
  },
];

const ANCHORAGE_STATUS_OPTIONS: PlanningStatusOption[] = [
  {
    kind: 'anchorageExisting',
    label: 'Vùng neo hiện trạng',
    status: 'Vùng neo hiện trạng',
    color: 9,
    swatchColor: PLANNING_STATUS_COLORS.existingAnchorage,
  },
  {
    kind: 'anchoragePlanned',
    label: 'Vùng neo quy hoạch',
    status: 'Vùng neo quy hoạch',
    color: 11,
    swatchColor: PLANNING_STATUS_COLORS.plannedAnchorage,
  },
];

const PILOT_STATUS_OPTIONS: PlanningStatusOption[] = [
  {
    kind: 'pilotExisting',
    label: 'Vùng đón trả hoa tiêu hiện trạng',
    status: 'Vùng đón trả hoa tiêu hiện trạng',
    color: 211,
    swatchColor: PLANNING_STATUS_COLORS.existingPilotArea,
  },
  {
    kind: 'pilotPlanned',
    label: 'Vùng đón trả hoa tiêu quy hoạch',
    status: 'Vùng đón trả hoa tiêu quy hoạch',
    color: 6,
    swatchColor: PLANNING_STATUS_COLORS.plannedPilotArea,
  },
];

const GENERIC_AREA_STATUS_OPTIONS: PlanningStatusOption[] = [
  {
    kind: 'genericExisting',
    label: 'Hiện trạng',
    status: 'Hiện trạng',
    color: 8,
    swatchColor: getPlanningAciColor(8),
  },
  {
    kind: 'genericPlanned',
    label: 'Quy hoạch',
    status: 'Quy hoạch',
    color: 7,
    swatchColor: getPlanningAciColor(7),
  },
  {
    kind: 'genericPlanned2030',
    label: 'Quy hoạch đến năm 2030',
    status: 'Quy hoạch đến năm 2030',
    color: 7,
    swatchColor: getPlanningAciColor(7),
  },
  {
    kind: 'genericAfter2030',
    label: 'Quy hoạch sau năm 2030',
    status: 'Quy hoạch sau năm 2030',
    color: 4,
    swatchColor: getPlanningAciColor(4),
  },
  {
    kind: 'genericVision2050',
    label: 'Quy hoạch tầm nhìn đến năm 2050',
    status: 'Quy hoạch đến năm 2050',
    color: 8,
    swatchColor: getPlanningAciColor(8),
  },
];

const normalizePlanningTableName = (value: unknown): string => normalizePlanningText(value)
  .replace(/[^a-z0-9]/g, '');

const getPlanningStatusOptions = (
  geometryType: unknown,
  tableName: unknown,
): PlanningStatusOption[] => {
  const normalizedType = String(geometryType ?? '').trim().toLowerCase();
  const normalizedTable = normalizePlanningTableName(tableName);

  if (normalizedTable.includes('vungdontrahoatieu')) return PILOT_STATUS_OPTIONS;
  if (normalizedTable.includes('vungneo')) return ANCHORAGE_STATUS_OPTIONS;
  if (normalizedType !== 'area') return [];
  if (normalizedTable.startsWith('bencang') || normalizedTable.includes('benphaottxd')) {
    return PORT_STATUS_OPTIONS;
  }
  return GENERIC_AREA_STATUS_OPTIONS;
};

const getPlanningStatusKind = (
  geometryType: unknown,
  tableName: unknown,
  status: unknown,
  colorIndex: unknown,
): PlanningStatusKind => {
  const normalizedType = String(geometryType ?? '').trim().toLowerCase();
  const normalizedTable = normalizePlanningTableName(tableName);
  const normalizedStatus = normalizePlanningText(status);
  const normalizedColor = Number(colorIndex);
  const isPort = normalizedTable.startsWith('bencang') || normalizedTable.includes('benphaottxd');
  const isAnchorage = normalizedTable.includes('vungneo');
  const isPilotArea = normalizedTable.includes('vungdontrahoatieu');

  if (isAnchorage) {
    if (normalizedStatus.includes('hien trang') || normalizedStatus.includes('hien huu')) {
      return 'anchorageExisting';
    }
    if (normalizedStatus.includes('quy hoach') || normalizedStatus.includes('2050')) {
      return 'anchoragePlanned';
    }
    if (normalizedColor === 9) return 'anchorageExisting';
    if (normalizedColor === 11) return 'anchoragePlanned';
  }

  if (isPilotArea) {
    if (normalizedStatus.includes('hien trang') || normalizedStatus.includes('hien huu')) {
      return 'pilotExisting';
    }
    if (normalizedStatus.includes('quy hoach') || normalizedStatus.includes('2030')) {
      return 'pilotPlanned';
    }
    if (normalizedColor === 9 || normalizedColor === 211) return 'pilotExisting';
    if (normalizedColor === 6 || normalizedColor === 7 || normalizedColor === 221) {
      return 'pilotPlanned';
    }
  }

  if (isPort) {
    if (normalizedStatus.includes('dieu kien')) return 'portConditional';
    if (
      normalizedStatus.includes('2050')
      || normalizedStatus.includes('sau nam 2030')
      || normalizedStatus.includes('tiem nang')
    ) {
      return 'portVision2050';
    }
    if (normalizedStatus.includes('2030')) return 'portPlanned2030';
    if (normalizedStatus.includes('hien huu') || normalizedStatus.includes('hien trang')) {
      return 'portExisting';
    }
    if (normalizedStatus === 'quy hoach' || normalizedStatus === '') {
      if (normalizedTable.includes('dieukien')) return 'portConditional';
      if (normalizedTable.includes('2050') || normalizedTable.includes('sau2030')) return 'portVision2050';
      if (normalizedTable.includes('2030')) return 'portPlanned2030';
      if (normalizedColor === 2) return 'portExisting';
      if ([1, 11, 21].includes(normalizedColor)) return 'portConditional';
      if ([7, 181].includes(normalizedColor)) return 'portVision2050';
      if (normalizedColor === 3) return 'portPlanned2030';
      if (normalizedStatus === 'quy hoach') return 'portPlanned2030';
    }
  }

  if (normalizedType === 'area') {
    if (normalizedStatus.includes('hien trang') || normalizedStatus.includes('hien huu')) {
      return 'genericExisting';
    }
    if (normalizedStatus.includes('2050')) {
      return 'genericVision2050';
    }
    if (normalizedStatus.includes('sau nam 2030')) return 'genericAfter2030';
    if (normalizedStatus.includes('2030')) return 'genericPlanned2030';
    if (normalizedStatus.includes('quy hoach')) return 'genericPlanned';
    if (normalizedStatus === '' && normalizedColor === 7) return 'genericPlanned';
  }

  return 'unknown';
};

export const getPlanningStatusPresentation = (
  geometryType: unknown,
  tableName: unknown,
  status: unknown,
  colorIndex: unknown,
): PlanningStatusPresentation => {
  const options = getPlanningStatusOptions(geometryType, tableName);
  const kind = getPlanningStatusKind(geometryType, tableName, status, colorIndex);
  const matchedOption = options.find((option) => option.kind === kind);

  return {
    kind,
    label: matchedOption?.label || String(status ?? '').trim() || 'Chưa xác định',
    swatchColor: matchedOption?.swatchColor
      || getPlanningFeatureColor(tableName, status, colorIndex),
    options,
  };
};

export const getPlanningFeatureColor = (
  tableName: unknown,
  status: unknown,
  colorIndex: unknown,
): string => {
  const normalizedTable = normalizePlanningText(tableName).replace(/[^a-z0-9]/g, '');
  const normalizedStatus = normalizePlanningText(status);

  if (normalizedTable.startsWith('bencang')) {
    if (normalizedStatus.includes('hien huu') || normalizedStatus.includes('hien trang')) {
      return PLANNING_STATUS_COLORS.existingPort;
    }
    if (normalizedStatus.includes('2030')) return PLANNING_STATUS_COLORS.planned2030;
    if (normalizedStatus.includes('dieu kien')) return PLANNING_STATUS_COLORS.conditionalDevelopment;
    if (normalizedStatus.includes('2050')) return PLANNING_STATUS_COLORS.vision2050;
  }

  if (normalizedTable.includes('vungneohientrang')) {
    return PLANNING_STATUS_COLORS.existingAnchorage;
  }
  if (normalizedTable.includes('vungneoquy') || normalizedTable.includes('vungneokethop')) {
    return PLANNING_STATUS_COLORS.plannedAnchorage;
  }
  if (normalizedTable.includes('vungdontrahoatieu')) {
    return normalizedStatus.includes('hien trang')
      ? PLANNING_STATUS_COLORS.existingPilotArea
      : PLANNING_STATUS_COLORS.plannedPilotArea;
  }
  if (normalizedTable.includes('ranhgioivungnuoc')) {
    return PLANNING_STATUS_COLORS.waterBoundary;
  }
  if (normalizedTable.includes('timluong')) {
    return PLANNING_STATUS_COLORS.channelCenterline;
  }

  return getPlanningAciColor(colorIndex);
};

export const getPlanningStyleZoomBand = (zoom: unknown): number => {
  const normalizedZoom = Number(zoom);
  if (!Number.isFinite(normalizedZoom) || normalizedZoom <= 8) return 0;
  if (normalizedZoom <= 11) return 1;
  return 2;
};

export const shouldRenderPlanningFeature = (
  geometryType: unknown,
  tableName: unknown,
  zoom: unknown,
): boolean => {
  const normalizedType = String(geometryType ?? '').trim().toLowerCase();
  const normalizedTable = normalizePlanningText(tableName).replace(/[^a-z0-9]/g, '');
  const normalizedZoom = Number(zoom);

  if (normalizedType !== 'point') return true;
  if (normalizedTable.includes('ghichu')) return normalizedZoom >= 13;
  return normalizedZoom >= 10;
};

export interface PlanningVisualStyle {
  color: string;
  fillColor: string;
  fillOpacity: number;
  opacity: number;
  radius: number;
  weight: number;
  dashArray?: string;
}

export const getPlanningVisualStyle = (
  geometryType: unknown,
  tableName: unknown,
  status: unknown,
  colorIndex: unknown,
  zoom: unknown,
): PlanningVisualStyle => {
  const normalizedType = String(geometryType ?? '').trim().toLowerCase();
  const normalizedTable = normalizePlanningText(tableName).replace(/[^a-z0-9]/g, '');
  const band = getPlanningStyleZoomBand(zoom);
  const color = getPlanningFeatureColor(tableName, status, colorIndex);
  const isPortArea = normalizedType === 'area' && normalizedTable.startsWith('bencang');

  const style: PlanningVisualStyle = {
    color,
    fillColor: color,
    fillOpacity: normalizedType === 'area'
      ? (isPortArea ? [0.68, 0.82, 0.92][band] : [0.06, 0.1, 0.16][band])
      : 0,
    opacity: 1,
    radius: [2.5, 3.25, 4.5][band],
    weight: normalizedType === 'line'
      ? [1.2, 1.7, 2.2][band]
      : (isPortArea ? [1, 1.5, 2][band] : [0.9, 1.3, 1.7][band]),
  };

  if (normalizedTable.includes('ranhgioivungnuoc')) {
    style.weight = [1.25, 1.8, 2.3][band];
  } else if (normalizedTable.includes('vungneohientrang')) {
    style.weight = [1, 1.35, 1.8][band];
  }

  return style;
};

export const getPlanningLeafletColorStyle = (
  geometryType: unknown,
  colorIndex: unknown,
  tableName?: unknown,
  status?: unknown,
): { color?: string; fillColor?: string } => {
  const color = getPlanningFeatureColor(tableName, status, colorIndex);
  const normalizedType = String(geometryType ?? '').trim().toLowerCase();

  if (normalizedType === 'point') return { fillColor: color };
  if (normalizedType === 'line') return { color };
  return { color, fillColor: color };
};
