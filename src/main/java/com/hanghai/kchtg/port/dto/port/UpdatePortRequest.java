package com.hanghai.kchtg.port.dto.port;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Request DTO for updating an existing Port.
 * The 'code' field is immutable (ignored after creation).
 * GPS fields (latitude/longitude) must be both present or both absent.
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class UpdatePortRequest extends FieldPresenceTrackedRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String portName;

    private String province;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal longitude;

    private BigDecimal area;

    private BigDecimal maxVesselCapacity;

    private com.hanghai.kchtg.common.entity.OperationalStatus operationalStatus;

    private UUID orgUnitId;

    private Integer portGroup;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Extended fields (V53) ────────────────────────────────────────

    private String detailedLocation;

    private Integer portClass;

    private Integer coordinateSystem;

    private Integer displayRule;

    // ── zobjDataSub fields ───────────────────────────────────────────

    private String waterAreaScope;

    private Integer totalBerths;

    private Integer totalAnchoragesTransshipment;

    private Integer totalPublicChannels;

    private Integer totalDedicatedChannels;

    @DecimalMin(value = "0", message = "Tổng chiều dài luồng công cộng phải >= 0")
    private BigDecimal totalPublicChannelLength;

    @DecimalMin(value = "0", message = "Tổng chiều dài luồng chuyên dùng phải >= 0")
    private BigDecimal totalDedicatedChannelLength;

    private Integer totalBuoysBeacons;

    private Integer totalDikes;

    @DecimalMin(value = "0", message = "Tổng chiều dài đê kè phải >= 0")
    private BigDecimal totalDikeLength;

    private Integer totalLighthouses;

    private Integer buoyBerthCount;

    private Integer anchorageCount;

    private Integer transshipmentCount;

    private String otherWaterAreas;

    private String remarks;

    private com.hanghai.kchtg.common.entity.ApprovalStatus approvalStatus;

    // ── Child lists ───────────────────────────────────────────────────

    private List<PortCoordinateDto> coordinateList;

    private List<PortInfrastructureDto> infrastructureList;

    private List<PortAttachmentDto> attachments;

    private List<PortWharfAreaDto> wharfAreas;

    public void setId(UUID id) {
        markFieldPresent("id");
        this.id = id;
    }

    public void setPortName(String portName) {
        markFieldPresent("portName");
        this.portName = portName;
    }

    public void setProvince(String province) {
        markFieldPresent("province");
        this.province = province;
    }

    public void setLatitude(BigDecimal latitude) {
        markFieldPresent("latitude");
        this.latitude = latitude;
    }

    public void setLongitude(BigDecimal longitude) {
        markFieldPresent("longitude");
        this.longitude = longitude;
    }

    public void setArea(BigDecimal area) {
        markFieldPresent("area");
        this.area = area;
    }

    public void setMaxVesselCapacity(BigDecimal maxVesselCapacity) {
        markFieldPresent("maxVesselCapacity");
        this.maxVesselCapacity = maxVesselCapacity;
    }

    public void setOperationalStatus(com.hanghai.kchtg.common.entity.OperationalStatus operationalStatus) {
        markFieldPresent("operationalStatus");
        this.operationalStatus = operationalStatus;
    }

    public void setOrgUnitId(UUID orgUnitId) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = orgUnitId;
    }

    public void setPortGroup(Integer portGroup) {
        markFieldPresent("portGroup");
        this.portGroup = portGroup;
    }

    public void setMapSymbolId(UUID mapSymbolId) {
        markFieldPresent("mapSymbolId");
        this.mapSymbolId = mapSymbolId;
    }

    public void setGeometryType(GisGeometryType geometryType) {
        markFieldPresent("geometryType");
        this.geometryType = geometryType;
    }

    public void setCoordinates(String coordinates) {
        markFieldPresent("coordinates");
        this.coordinates = coordinates;
    }

    public void setDetailedLocation(String detailedLocation) {
        markFieldPresent("detailedLocation");
        this.detailedLocation = detailedLocation;
    }

    public void setPortClass(Integer portClass) {
        markFieldPresent("portClass");
        this.portClass = portClass;
    }

    public void setCoordinateSystem(Integer coordinateSystem) {
        markFieldPresent("coordinateSystem");
        this.coordinateSystem = coordinateSystem;
    }

    public void setDisplayRule(Integer displayRule) {
        markFieldPresent("displayRule");
        this.displayRule = displayRule;
    }

    public void setWaterAreaScope(String waterAreaScope) {
        markFieldPresent("waterAreaScope");
        this.waterAreaScope = waterAreaScope;
    }

    public void setTotalBerths(Integer totalBerths) {
        markFieldPresent("totalBerths");
        this.totalBerths = totalBerths;
    }

    public void setTotalAnchoragesTransshipment(Integer totalAnchoragesTransshipment) {
        markFieldPresent("totalAnchoragesTransshipment");
        this.totalAnchoragesTransshipment = totalAnchoragesTransshipment;
    }

    public void setTotalPublicChannels(Integer totalPublicChannels) {
        markFieldPresent("totalPublicChannels");
        this.totalPublicChannels = totalPublicChannels;
    }

    public void setTotalDedicatedChannels(Integer totalDedicatedChannels) {
        markFieldPresent("totalDedicatedChannels");
        this.totalDedicatedChannels = totalDedicatedChannels;
    }

    public void setTotalPublicChannelLength(BigDecimal totalPublicChannelLength) {
        markFieldPresent("totalPublicChannelLength");
        this.totalPublicChannelLength = totalPublicChannelLength;
    }

    public void setTotalDedicatedChannelLength(BigDecimal totalDedicatedChannelLength) {
        markFieldPresent("totalDedicatedChannelLength");
        this.totalDedicatedChannelLength = totalDedicatedChannelLength;
    }

    public void setTotalBuoysBeacons(Integer totalBuoysBeacons) {
        markFieldPresent("totalBuoysBeacons");
        this.totalBuoysBeacons = totalBuoysBeacons;
    }

    public void setTotalDikes(Integer totalDikes) {
        markFieldPresent("totalDikes");
        this.totalDikes = totalDikes;
    }

    public void setTotalDikeLength(BigDecimal totalDikeLength) {
        markFieldPresent("totalDikeLength");
        this.totalDikeLength = totalDikeLength;
    }

    public void setTotalLighthouses(Integer totalLighthouses) {
        markFieldPresent("totalLighthouses");
        this.totalLighthouses = totalLighthouses;
    }

    public void setBuoyBerthCount(Integer buoyBerthCount) {
        markFieldPresent("buoyBerthCount");
        this.buoyBerthCount = buoyBerthCount;
    }

    public void setAnchorageCount(Integer anchorageCount) {
        markFieldPresent("anchorageCount");
        this.anchorageCount = anchorageCount;
    }

    public void setTransshipmentCount(Integer transshipmentCount) {
        markFieldPresent("transshipmentCount");
        this.transshipmentCount = transshipmentCount;
    }

    public void setOtherWaterAreas(String otherWaterAreas) {
        markFieldPresent("otherWaterAreas");
        this.otherWaterAreas = otherWaterAreas;
    }

    public void setRemarks(String remarks) {
        markFieldPresent("remarks");
        this.remarks = remarks;
    }

    public void setApprovalStatus(com.hanghai.kchtg.common.entity.ApprovalStatus approvalStatus) {
        markFieldPresent("approvalStatus");
        this.approvalStatus = approvalStatus;
    }

    public void setCoordinateList(List<PortCoordinateDto> coordinateList) {
        markFieldPresent("coordinateList");
        this.coordinateList = coordinateList;
    }

    public void setInfrastructureList(List<PortInfrastructureDto> infrastructureList) {
        markFieldPresent("infrastructureList");
        this.infrastructureList = infrastructureList;
    }

    public void setAttachments(List<PortAttachmentDto> attachments) {
        markFieldPresent("attachments");
        this.attachments = attachments;
    }

    public void setWharfAreas(List<PortWharfAreaDto> wharfAreas) {
        markFieldPresent("wharfAreas");
        this.wharfAreas = wharfAreas;
    }
}
