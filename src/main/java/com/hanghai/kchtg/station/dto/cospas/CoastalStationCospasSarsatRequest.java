package com.hanghai.kchtg.station.dto.cospas;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class CoastalStationCospasSarsatRequest {

    @Size(max = 50)
    private String stationCode;
    @Size(max = 255)
    private String stationName;
    @Size(max = 50)
    private String code;
    @Size(max = 255)
    private String name;

    private UUID orgUnitId;
    private UUID unitId;
    private UUID operatingOrgId;
    private UUID owningOrgId;
    private Integer provinceId;

    private ConditionStatus conditionStatus;

    @Size(max = 255)
    private String frequency;
    @Size(max = 4000)
    private String coverageArea;
    @Size(max = 255)
    private String beaconProtocol;
    @Size(max = 255)
    private String emergencyChannel;
    @Size(max = 255)
    private String antennaType;
    @Size(max = 500)
    private String locationAddress;
    @Size(max = 255)
    private String contactPerson;
    @Size(max = 255)
    private String contactPhone;
    @PositiveOrZero
    private Double signalRange;
    @Size(max = 255)
    private String operatingMode;
    @Size(max = 1000)
    private String servicesProvided;
    private Object services;

    @Size(max = 2000)
    private String description;
    @Size(max = 2000)
    private String note;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;
    @Size(max = 50)
    private String coordinateReferenceSystem;
    @Size(max = 50)
    private String objectType;
    @Size(max = 50)
    private String coordinateSystem;
    @Size(max = 255)
    private String displayRule;
    private String wktGeometry;
    private Double latitude;
    private Double longitude;

    private ApprovalStatus approvalStatus;

    // --- Helper methods / Aliases ---

    public String getEffectiveServicesProvided() {
        if (servicesProvided != null && !servicesProvided.trim().isEmpty()) {
            return servicesProvided.trim();
        }
        if (services instanceof String s && !s.trim().isEmpty()) {
            return s.trim();
        }
        if (services instanceof java.util.List<?> list) {
            return list.stream()
                    .map(Object::toString)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(java.util.stream.Collectors.joining(", "));
        }
        return null;
    }

    public String getEffectiveCoordinates() {
        if (coordinates != null && !coordinates.trim().isEmpty()) return coordinates.trim();
        return wktGeometry != null ? wktGeometry.trim() : null;
    }

    public GisGeometryType getEffectiveGeometryType() {
        if (geometryType != null) return geometryType;
        if (objectType != null) {
            String ot = objectType.trim().toUpperCase();
            if (ot.contains("LINE")) return GisGeometryType.LINE;
            if (ot.contains("POLY")) return GisGeometryType.POLYGON;
            return GisGeometryType.POINT;
        }
        return GisGeometryType.POINT;
    }

    public String getEffectiveCoordinateReferenceSystem() {
        if (coordinateReferenceSystem != null && !coordinateReferenceSystem.trim().isEmpty()) return coordinateReferenceSystem.trim();
        return coordinateSystem != null ? coordinateSystem.trim() : null;
    }

    public String getEffectiveCode() {
        if (code != null && !code.trim().isEmpty()) return code.trim();
        return stationCode != null ? stationCode.trim() : null;
    }

    public String getEffectiveName() {
        if (name != null && !name.trim().isEmpty()) return name.trim();
        return stationName != null ? stationName.trim() : null;
    }

    public UUID getEffectiveOrgUnitId() {
        return orgUnitId != null ? orgUnitId : unitId;
    }

    public String getEffectiveNote() {
        if (note != null && !note.trim().isEmpty()) return note.trim();
        return description != null ? description.trim() : null;
    }

    public String getStationCode() {
        return getEffectiveCode();
    }

    public void setStationCode(String stationCode) {
        this.stationCode = stationCode;
        if (this.code == null) this.code = stationCode;
    }

    public String getStationName() {
        return getEffectiveName();
    }

    public void setStationName(String stationName) {
        this.stationName = stationName;
        if (this.name == null) this.name = stationName;
    }

    public String getCode() {
        return getEffectiveCode();
    }

    public void setCode(String code) {
        this.code = code;
        if (this.stationCode == null) this.stationCode = code;
    }

    public String getName() {
        return getEffectiveName();
    }

    public void setName(String name) {
        this.name = name;
        if (this.stationName == null) this.stationName = name;
    }

    public UUID getUnitId() {
        return getEffectiveOrgUnitId();
    }

    public void setUnitId(UUID unitId) {
        this.unitId = unitId;
        if (this.orgUnitId == null) this.orgUnitId = unitId;
    }

    public UUID getOrgUnitId() {
        return getEffectiveOrgUnitId();
    }

    public void setOrgUnitId(UUID orgUnitId) {
        this.orgUnitId = orgUnitId;
        if (this.unitId == null) this.unitId = orgUnitId;
    }

    public String getDescription() {
        return getEffectiveNote();
    }

    public void setDescription(String description) {
        this.description = description;
        if (this.note == null) this.note = description;
    }

    public String getNote() {
        return getEffectiveNote();
    }

    public void setNote(String note) {
        this.note = note;
        if (this.description == null) this.description = note;
    }
}
