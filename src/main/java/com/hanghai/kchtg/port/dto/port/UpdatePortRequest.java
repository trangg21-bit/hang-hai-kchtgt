package com.hanghai.kchtg.port.dto.port;

import java.util.UUID;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

/**
 * Request DTO for updating an existing Port.
 * The 'code' field is immutable (ignored after creation).
 * GPS fields (latitude/longitude) must be both present or both absent.
 * Supports composite form: replacing coordinates[] and infrastructure[].
 */
@Data
public class UpdatePortRequest {

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

    @DecimalMin(value = "0", inclusive = true, message = "Diện tích phải lớn hơn 0")
    private BigDecimal area;

    private BigDecimal maxVesselCapacity;

    private UUID orgUnitId;

    private Integer portGroup;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Managing unit & notes ───────────────────────────────────────

    private UUID managingUnitId;

    private String notes;

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

    // ── Composite form fields ────────────────────────────────────────

    private List<CoordinateDto> portCoordinates;

    private List<InfrastructureDto> portInfrastructures;
}
