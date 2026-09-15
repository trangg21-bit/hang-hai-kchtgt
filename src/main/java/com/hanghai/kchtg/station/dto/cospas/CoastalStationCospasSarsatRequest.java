package com.hanghai.kchtg.station.dto.cospas;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
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

    private String stationCode;
    private String stationName;
    private String code;
    private String name;

    private UUID orgUnitId;
    private UUID unitId;
    private UUID operatingOrgId;
    private UUID owningOrgId;
    private Integer provinceId;

    private ConditionStatus conditionStatus;

    private String frequency;
    private String coverageArea;
    private String beaconProtocol;
    private String emergencyChannel;
    private String antennaType;
    private String locationAddress;
    private String contactPerson;
    private String contactPhone;
    private Double signalRange;
    private String operatingMode;

    private String description;
    private String note;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;
    private String coordinateReferenceSystem;

    private ApprovalStatus approvalStatus;

    // --- Helper methods / Aliases ---

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
