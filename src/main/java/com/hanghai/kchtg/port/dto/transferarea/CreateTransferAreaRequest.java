package com.hanghai.kchtg.port.dto.transferarea;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class CreateTransferAreaRequest {

    // private RecordSecurityLevel securityLevel;

    @Size(max = 50)
    private String transferAreaCode;

    @NotBlank(message = "Tên khu chuyển tải không được để trống")
    @Size(max = 255)
    private String transferAreaName;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID portId;

    private UUID orgUnitId;

    @NotNull(message = "Địa điểm (Tỉnh/Thành phố) không được để trống")
    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    @NotBlank(message = "Công năng khai thác không được để trống")
    @Size(max = 500)
    private String operationalFunctions;

    @NotNull(message = "Tình trạng không được để trống")
    private OperationalStatus operationalStatus;

    private String shapeDescription;

    @DecimalMin("0")
    private BigDecimal area;

    @DecimalMin("0")
    private BigDecimal designWaterDepth;

    @DecimalMin("0")
    private BigDecimal currentWaterDepth;

    @DecimalMin("0")
    private BigDecimal bottomElevationDesign;

    @DecimalMin("0")
    private BigDecimal maxVesselDWT;

    private Integer activeTransferCount;

    private Integer publishedTransferCount;

    private Integer underInvestmentTransferCount;

    private String remarks;

    private LocalDateTime openingAnnouncementDate;

    @Size(max = 500)
    private String publicDecision;

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

    private List<TransferAreaMooringWaterAreaRequest> mooringWaterAreas;

    private String saveAction; // DRAFT, SUBMIT, SAVE_AND_APPROVE
}
