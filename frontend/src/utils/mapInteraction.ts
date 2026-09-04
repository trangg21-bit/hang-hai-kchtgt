export interface SharedMapView {
  latitude: number;
  longitude: number;
  zoom: number;
}

const isFiniteInRange = (value: number, min: number, max: number) =>
  Number.isFinite(value) && value >= min && value <= max;

export const parseSharedMapView = (search: string): SharedMapView | null => {
  const params = new URLSearchParams(search);
  if (!params.has('mapLat') || !params.has('mapLon') || !params.has('mapZoom')) {
    return null;
  }
  const latitude = Number(params.get('mapLat'));
  const longitude = Number(params.get('mapLon'));
  const zoom = Number(params.get('mapZoom'));

  if (
    !isFiniteInRange(latitude, -90, 90)
    || !isFiniteInRange(longitude, -180, 180)
    || !isFiniteInRange(zoom, 1, 20)
  ) {
    return null;
  }

  return { latitude, longitude, zoom };
};

export const buildMapShareUrl = (
  currentUrl: string,
  latitude: number,
  longitude: number,
  zoom: number,
): string => {
  const url = new URL(currentUrl);
  url.searchParams.set('mapLat', latitude.toFixed(6));
  url.searchParams.set('mapLon', longitude.toFixed(6));
  url.searchParams.set('mapZoom', String(Math.round(zoom)));
  return url.toString();
};

export const circleToPolygonCoordinates = (
  latitudeDegrees: number,
  longitudeDegrees: number,
  radiusInMeters: number,
  vertexCount = 64,
): number[][] => {
  const earthRadiusInMeters = 6371008.8;
  const angularDistance = radiusInMeters / earthRadiusInMeters;
  const latitude = latitudeDegrees * Math.PI / 180;
  const longitude = longitudeDegrees * Math.PI / 180;
  const coordinates: number[][] = [];

  for (let index = 0; index <= vertexCount; index += 1) {
    const bearing = index / vertexCount * Math.PI * 2;
    const targetLatitude = Math.asin(
      Math.sin(latitude) * Math.cos(angularDistance)
      + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const targetLongitude = longitude + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
      Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(targetLatitude),
    );
    coordinates.push([
      targetLongitude * 180 / Math.PI,
      targetLatitude * 180 / Math.PI,
    ]);
  }

  coordinates[coordinates.length - 1] = [...coordinates[0]];

  return coordinates;
};
