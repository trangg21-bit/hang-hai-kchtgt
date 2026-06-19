export interface MapLayer {
  id: string;
  name: string;
  code: string;
  layerType: MapLayer.LayerType;
  source?: string;
  visible: boolean;
  opacity: number;
  order: number;
  styleConfig?: string;
  status: MapLayer.Status;
  createdAt?: string;
  updatedAt?: string;
}

export namespace MapLayer {
  export enum LayerType {
    POINT = 'POINT',
    LINE = 'LINE',
    POLYGON = 'POLYGON',
    BASEMAP = 'BASEMAP',
    OVERLAY = 'OVERLAY',
  }

  export enum Status {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
  }
}

export interface CreateMapLayerPayload {
  name: string;
  code: string;
  layerType: MapLayer.LayerType;
  source?: string;
  visible?: boolean;
  opacity?: number;
  order?: number;
  styleConfig?: string;
}

export interface UpdateMapLayerPayload {
  name?: string;
  code?: string;
  layerType?: MapLayer.LayerType;
  source?: string;
  visible?: boolean;
  opacity?: number;
  order?: number;
  styleConfig?: string;
}

export interface MapView {
  id: string;
  name: string;
  code: string;
  userId?: number;
  centerLat: number;
  centerLon: number;
  zoom: number;
  layers: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMapViewPayload {
  name: string;
  code: string;
  userId?: number;
  centerLat: number;
  centerLon: number;
  zoom: number;
  layers: string[];
}

export interface UpdateMapViewPayload {
  name?: string;
  code?: string;
  centerLat?: number;
  centerLon?: number;
  zoom?: number;
  layers?: string[];
}

export interface MapOverlay {
  id: string;
  name: string;
  layerName: string;
  overlayType: string;
  visible: boolean;
  opacity: number;
  imageUrl?: string;
  coordinates?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMapOverlayPayload {
  name: string;
  layerName: string;
  overlayType: string;
  visible?: boolean;
  opacity?: number;
  imageUrl?: string;
  coordinates?: string;
}

export interface UpdateMapOverlayPayload {
  name?: string;
  layerName?: string;
  overlayType?: string;
  visible?: boolean;
  opacity?: number;
  imageUrl?: string;
  coordinates?: string;
}

export interface MapStyle {
  id: string;
  name: string;
  layerId: string;
  styleType: string;
  color?: string;
  lineWidth?: number;
  fillColor?: string;
  opacity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMapStylePayload {
  name: string;
  layerId: string;
  styleType: string;
  color?: string;
  lineWidth?: number;
  fillColor?: string;
  opacity?: number;
}

export interface UpdateMapStylePayload {
  name?: string;
  layerId?: string;
  styleType?: string;
  color?: string;
  lineWidth?: number;
  fillColor?: string;
  opacity?: number;
}

export const MAP_LAYER_TYPE_OPTIONS = [
  { value: MapLayer.LayerType.POINT, label: 'Đối tượng điểm' },
  { value: MapLayer.LayerType.LINE, label: 'Đối tượng đường' },
  { value: MapLayer.LayerType.POLYGON, label: 'Đối tượng vùng' },
  { value: MapLayer.LayerType.BASEMAP, label: 'Bản đồ nền' },
  { value: MapLayer.LayerType.OVERLAY, label: 'Lớp phủ' },
];

export const MAP_LAYER_STATUS_MAP: Record<string, { color: string; label: string }> = {
  [MapLayer.Status.ACTIVE]: { color: 'green', label: 'Hoạt động' },
  [MapLayer.Status.INACTIVE]: { color: 'default', label: 'Không hoạt động' },
};
