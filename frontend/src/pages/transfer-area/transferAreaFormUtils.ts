export interface TransferAreaGisSelection {
  geometryType?: string;
  symbolId?: string;
}

export interface TransferAreaGisFormPatch {
  geometryType: string;
  coordinateSystem: number;
  displayRule: string;
  mapSymbolId?: string;
}

export function buildTransferAreaGisFormPatch(
  selection: TransferAreaGisSelection,
  currentCoordinateSystem?: number,
): TransferAreaGisFormPatch {
  return {
    geometryType: selection.geometryType?.trim().toUpperCase() || 'POINT',
    coordinateSystem: currentCoordinateSystem ?? 1,
    displayRule: 'Độ, phút, giây (DMS)',
    ...(selection.symbolId ? { mapSymbolId: selection.symbolId } : {}),
  };
}
