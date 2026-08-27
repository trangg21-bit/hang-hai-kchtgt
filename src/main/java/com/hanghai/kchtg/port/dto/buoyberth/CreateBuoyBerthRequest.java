package com.hanghai.kchtg.port.dto.buoyberth;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateBuoyBerthRequest {

    private RecordSecurityLevel securityLevel;

    @Size(max = 50)
    private String buoyBerthCode;

    @NotBlank(message = "Tên bến phao không được để trống")
    @Size(max = 255)
    private String buoyBerthName;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID portId;

    private UUID orgUnitId;

    private UUID waterwayId;

    @Size(max = 100)
    private String classification;

    @NotNull(message = "Địa điểm (Tỉnh/Thành phố) không được để trống")
    private Integer provinceId;

    @Size(max = 500)
    private String detailedLocation;

    @NotNull(message = "Tình trạng không được để trống")
    private OperationalStatus operationalStatus;

    private UUID operatingOrgId;

    @DecimalMin("0")
    private BigDecimal currentWaterDepth;

    @DecimalMin("0")
    private BigDecimal bottomElevationDesign;

    @DecimalMin("0")
    private BigDecimal maxVesselDWT;

    @DecimalMin("0")
    private BigDecimal plannedVesselDWT;

    private LocalDate lastInspectionDate;

    private LocalDate nextInspectionDate;

    private LocalDate operationExpiryDate;

    @DecimalMin("0")
    private BigDecimal designCapacity;

    private Integer activeBuoyBerthCount;

    private Integer publishedBuoyBerthCount;

    private Integer underInvestmentBuoyBerthCount;

    @NotNull(message = "Sản lượng hàng thông qua không được để trống")
    @DecimalMin("0")
    private BigDecimal cargoThroughput;

    private LocalDateTime openingAnnouncementDate;

    @Size(max = 500)
    private String publicDecision;

    private String investmentAgreement;

    @Size(max = 1000)
    private String mooringWaterAreaScope;

    // ── GIS fields ─────────────────────────────────────────────────────
    private BigDecimal latitude;
    private BigDecimal longitude;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;
    private Integer coordinateSystem;
    private Integer displayRule;

    private String saveAction; // DRAFT, SUBMIT, SAVE_AND_APPROVE
}
