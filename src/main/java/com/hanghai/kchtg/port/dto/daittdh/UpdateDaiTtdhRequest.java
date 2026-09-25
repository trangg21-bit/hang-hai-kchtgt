package com.hanghai.kchtg.port.dto.daittdh;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
public class UpdateDaiTtdhRequest extends FieldPresenceTrackedRequest {

    // private RecordSecurityLevel securityLevel;

    @NotNull(message = "ID không được để trống")
    private UUID id;

    @Size(max = 255)
    private String daiTtdhName;

    private UUID orgUnitId;

    private UUID operatingUnitId;

    private Integer stationLevel;

    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    private OperationalStatus operationalStatus;

    private String coverageArea;

    @Size(max = 500)
    private String servicesProvided;

    @Size(max = 2000)
    private String remarks;

    // ── GIS fields ─────────────────────────────────────────────────────
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private String displayRule;

    private String saveAction;
    private ApprovalStatus approvalStatus;

    public void setApprovalStatus(ApprovalStatus value) { markFieldPresent("approvalStatus"); this.approvalStatus = value; }
    public void setDaiTtdhName(String value) { markFieldPresent("daiTtdhName"); this.daiTtdhName = value; }
    public void setOrgUnitId(UUID value) { markFieldPresent("orgUnitId"); this.orgUnitId = value; }
    public void setOperatingUnitId(UUID value) { markFieldPresent("operatingUnitId"); this.operatingUnitId = value; }
    public void setStationLevel(Integer value) { markFieldPresent("stationLevel"); this.stationLevel = value; }
    public void setProvinceId(Integer value) { markFieldPresent("provinceId"); this.provinceId = value; }
    public void setDetailedLocation(String value) { markFieldPresent("detailedLocation"); this.detailedLocation = value; }
    public void setOperationalStatus(OperationalStatus value) { markFieldPresent("operationalStatus"); this.operationalStatus = value; }
    public void setCoverageArea(String value) { markFieldPresent("coverageArea"); this.coverageArea = value; }
    public void setServicesProvided(String value) { markFieldPresent("servicesProvided"); this.servicesProvided = value; }
    public void setRemarks(String value) { markFieldPresent("remarks"); this.remarks = value; }
    public void setLatitude(java.math.BigDecimal value) { markFieldPresent("latitude"); this.latitude = value; }
    public void setLongitude(java.math.BigDecimal value) { markFieldPresent("longitude"); this.longitude = value; }
    public void setMapSymbolId(UUID value) { markFieldPresent("mapSymbolId"); this.mapSymbolId = value; }
    public void setGeometryType(GisGeometryType value) { markFieldPresent("geometryType"); this.geometryType = value; }
    public void setCoordinates(String value) { markFieldPresent("coordinates"); this.coordinates = value; }
    public void setCoordinateSystem(Integer value) { markFieldPresent("coordinateSystem"); this.coordinateSystem = value; }
    public void setDisplayRule(String value) { markFieldPresent("displayRule"); this.displayRule = value; }
}
