type PortHistoryCoordinate = { latitude: number; longitude: number };

const toDms = (decimal: number): string => {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Number(((minutesFloat - minutes) * 60).toFixed(4));
  return `${degrees}° ${minutes}′ ${seconds}″`;
};

const parseCoordinatePairs = (value: string): PortHistoryCoordinate[] => {
  const body = value.trim()
    .replace(/^SRID=\d+;/i, '')
    .replace(/^(POINT|MULTIPOINT|LINESTRING|POLYGON)\s*/i, '')
    .replace(/[()]/g, '')
    .trim();

  if (!body) return [];
  return body.split(',').map((pair) => {
    const [longitudeText, latitudeText] = pair.trim().split(/\s+/);
    return { longitude: Number(longitudeText), latitude: Number(latitudeText) };
  }).filter(({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude));
};

export const formatPortHistoryCoordinates = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  const raw = String(value).trim();
  if (!raw || raw === '—' || raw.toLowerCase() === 'null') return '';

  const coordinates = parseCoordinatePairs(raw);
  if (coordinates.length === 0) return raw;

  const uniqueCoordinates = coordinates.filter((coordinate, index) => {
    if (index !== coordinates.length - 1 || coordinates.length < 2) return true;
    const first = coordinates[0];
    return coordinate.latitude !== first.latitude || coordinate.longitude !== first.longitude;
  });

  return uniqueCoordinates.map((coordinate, index) => (
    `${index + 1}. Vĩ độ: ${toDms(coordinate.latitude)}; Kinh độ: ${toDms(coordinate.longitude)}`
  )).join('\n');
};
