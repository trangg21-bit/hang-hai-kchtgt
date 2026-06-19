export interface SearchQuery {
  queryType: SearchQuery.QueryType;
}

export namespace SearchQuery {
  export enum QueryType {
    TEXT = 'TEXT',
    LOCATION = 'LOCATION',
    RADIUS = 'RADIUS',
    POLYGON = 'POLYGON',
    COORDINATE = 'COORDINATE',
  }
}

export interface GisSearchRequest {
  query?: string;
  queryType: SearchQuery.QueryType;
  centerLon?: number;
  centerLat?: number;
  radius?: number;
  coordinates?: string;
  layerTypes?: string;
  statuses?: string;
  unitId?: number;
  page?: number;
  size?: number;
}

export interface SearchResultItem {
  objectId: string;
  objectType: string;
  name: string;
  code: string;
  distance?: number;
  layerType?: string;
}

export interface GisSearchResponse {
  results: SearchResultItem[];
  totalResults: number;
  page: number;
  size: number;
  durationMs: number;
}

export interface SearchHistoryItem {
  id: string;
  userId?: number;
  queryType: SearchQuery.QueryType;
  queryText: string;
  resultCount: number;
  durationMs: number;
  executedAt: string;
}

export const SEARCH_TYPE_OPTIONS = [
  { value: SearchQuery.QueryType.TEXT, label: 'Văn bản' },
  { value: SearchQuery.QueryType.LOCATION, label: 'Vị trí' },
  { value: SearchQuery.QueryType.RADIUS, label: 'bán kính' },
  { value: SearchQuery.QueryType.POLYGON, label: 'Đa giác' },
  { value: SearchQuery.QueryType.COORDINATE, label: 'Tọa độ' },
];
