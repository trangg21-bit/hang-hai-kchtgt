package com.hanghai.kchtg.port.dto.port;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO for creating a new Port.
 * GPS fields (latitude/longitude) must be both present or both absent.
 */
@Data
public class CreatePortRequest {

    @NotBlank(message = "Mã cảng không được để trống")
    @Size(max = 50, message = "Mã cảng tối đa 50 ký tự")
    private String portCode;

    @NotBlank(message = "Tên cảng không được để trống")
    @Size(max = 255, message = "Tên cảng tối đa 255 ký tự")
    private String portName;

    private Integer provinceId;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal longitude;

    @DecimalMin(value = "0", inclusive = false, message = "Diện tích phải lớn hơn 0")
    private BigDecimal area;

    private BigDecimal maxVesselCapacity;

    private OperationalStatus operationalStatus;

    private UUID orgUnitId;

    private Integer portGroup;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Extended fields (V53) ────────────────────────────────────────

    @Size(max = 500, message = "Địa điểm chi tiết tối đa 500 ký tự")
    private String detailedLocation;

    private Integer portClass;

    private Integer coordinateSystem;

    private Integer displayRule;

    // ── zobjDataSub fields ───────────────────────────────────────────

    @Size(max = 2000, message = "Phạm vi vùng nước tối đa 2000 ký tự")
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

    @Size(max = 2000, message = "Các khu nước khác tối đa 2000 ký tự")
    private String otherWaterAreas;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String remarks;

    @AssertTrue(message = "Vĩ độ và kinh độ phải được điền đồng thời")
    public boolean isGpsPaired() {
        return (latitude == null && longitude == null) || (latitude != null && longitude != null);
    }
}
