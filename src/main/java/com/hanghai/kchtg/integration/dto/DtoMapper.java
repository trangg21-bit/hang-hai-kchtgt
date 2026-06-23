package com.hanghai.kchtg.integration.dto;

import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Static utility for mapping GIS entities to their Wave-1 DTOs.
 * Each method filters by the expected ObjectType so callers do not need
 * to repeat the filter logic in controllers or services.
 */
public final class DtoMapper {

    private DtoMapper() {
        // utility class — no instantiation
    }

    // ── PointObject → DTOs ────────────────────────────────────────

    /**
     * Maps PointObjects filtered by ObjectType=PORT (Pier/Dock).
     */
    public static List<PierDto> toPierDtos(List<PointObject> points) {
        return points.stream()
                .filter(p -> p.getObjectType() == PointObject.ObjectType.PORT)
                .map(PierDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Maps PointObjects filtered by ObjectType=BUOY (Buoy berth).
     */
    public static List<BuoyBerthDto> toBuoyBerthDtos(List<PointObject> points) {
        return points.stream()
                .filter(p -> p.getObjectType() == PointObject.ObjectType.BUOY)
                .map(BuoyBerthDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Maps PointObjects filtered by ObjectType=BUOY (Buoy marker).
     */
    public static List<BuoyMarkerDto> toBuoyMarkerDtos(List<PointObject> points) {
        return points.stream()
                .filter(p -> p.getObjectType() == PointObject.ObjectType.BUOY)
                .map(BuoyMarkerDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Maps PointObjects filtered by ObjectType=BEACON (Beacon).
     */
    public static List<BeaconDto> toBeaconDtos(List<PointObject> points) {
        return points.stream()
                .filter(p -> p.getObjectType() == PointObject.ObjectType.BEACON)
                .map(BeaconDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Maps PointObjects filtered by ObjectType=OTHER (Repair facility).
     */
    public static List<RepairFacilityDto> toRepairFacilityDtos(List<PointObject> points) {
        return points.stream()
                .filter(p -> p.getObjectType() == PointObject.ObjectType.OTHER)
                .map(RepairFacilityDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Maps PointObjects for VTS — uses PORT type since VTS is a port-related facility.
     */
    public static List<VtsSystemDto> toVtsSystemDtos(List<PointObject> points) {
        return points.stream()
                .filter(p -> p.getObjectType() == PointObject.ObjectType.PORT)
                .map(VtsSystemDto::from)
                .collect(Collectors.toList());
    }

    // ── LineObject → DTOs ─────────────────────────────────────────

    /**
     * Maps LineObjects filtered by ObjectType=WATERWAY (Bridge).
     */
    public static List<BridgeDto> toBridgeDtos(List<LineObject> lines) {
        return lines.stream()
                .filter(l -> l.getObjectType() == LineObject.ObjectType.WATERWAY)
                .map(BridgeDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Maps LineObjects filtered by ObjectType=SHIPPING_ROUTE (Transport route).
     */
    public static List<TransportRouteDto> toTransportRouteDtos(List<LineObject> lines) {
        return lines.stream()
                .filter(l -> l.getObjectType() == LineObject.ObjectType.SHIPPING_ROUTE)
                .map(TransportRouteDto::from)
                .collect(Collectors.toList());
    }

    // ── PolygonObject → DTOs ──────────────────────────────────────

    /**
     * Maps PolygonObjects filtered by ObjectType=STORM_SHELTER.
     */
    public static List<StormShelterDto> toStormShelterDtos(List<PolygonObject> polygons) {
        return polygons.stream()
                .filter(p -> p.getObjectType() == PolygonObject.ObjectType.STORM_SHELTER)
                .map(StormShelterDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Maps PolygonObjects filtered by ObjectType=ANCHORAGE.
     */
    public static List<AnchorageDto> toAnchorageDtos(List<PolygonObject> polygons) {
        return polygons.stream()
                .filter(p -> p.getObjectType() == PolygonObject.ObjectType.ANCHORAGE)
                .map(AnchorageDto::from)
                .collect(Collectors.toList());
    }
}
