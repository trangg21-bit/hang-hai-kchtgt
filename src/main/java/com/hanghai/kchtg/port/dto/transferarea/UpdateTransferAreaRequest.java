package com.hanghai.kchtg.port.dto.transferarea;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateTransferAreaRequest {

    // private RecordSecurityLevel securityLevel;

    @NotNull(message = "ID không được để trống")
    private UUID id;

    @Size(max = 255)
    private String transferAreaName;

    private UUID portId;

    private UUID orgUnitId;

    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    @Size(max = 500)
    private String operationalFunctions;

    private OperationalStatus operationalStatus;

    private String shapeDescription;

    @DecimalMin("0")
    private BigDecimal area;

    @Size(max = 20, message = "Độ sâu khu nước theo thiết kế không vượt quá 20 ký tự")
    private String designWaterDepth;

    @Size(max = 20, message = "Độ sâu khu nước hiện tại không vượt quá 20 ký tự")
    private String currentWaterDepth;

    @Size(max = 20, message = "Cao độ đáy bến thiết kế không vượt quá 20 ký tự")
    private String bottomElevationDesign;

    @Size(max = 20, message = "Cỡ tàu khai thác không vượt quá 20 ký tự")
    private String maxVesselDWT;

    @Max(value = 99999, message = "Số lượng khu chuyển tải đang khai thác không vượt quá 5 chữ số")
    private Integer activeTransferCount;

    @Max(value = 99999, message = "Số lượng khu chuyển tải đã công bố không vượt quá 5 chữ số")
    private Integer publishedTransferCount;

    @Max(value = 99999, message = "Số lượng khu chuyển tải đang được thỏa thuận đầu tư xây dựng không vượt quá 5 chữ số")
    private Integer underInvestmentTransferCount;

    private String remarks;

    private LocalDateTime openingAnnouncementDate;

    @Size(max = 2000, message = "Quyết định công bố không vượt quá 2000 ký tự")
    private String publicDecision;

    @Size(max = 2000, message = "Thỏa thuận thông số, vị trí đầu tư xây dựng không vượt quá 2000 ký tự")
    private String investmentAgreement;

    private LocalDateTime activityStartDate;

    private LocalDateTime activityEndDate;

    // ── GIS fields ─────────────────────────────────────────────────────
    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    @com.fasterxml.jackson.annotation.JsonSetter("displayRule")
    public void setDisplayRule(Object value) {
        if (value instanceof Number n) {
            this.displayRule = n.intValue();
        } else if (value instanceof String s) {
            try {
                this.displayRule = Integer.parseInt(s.trim());
            } catch (Exception e) {
                this.displayRule = 1;
            }
        }
    }

    private List<TransferAreaMooringWaterAreaRequest> mooringWaterAreas;

    private String saveAction;
}
