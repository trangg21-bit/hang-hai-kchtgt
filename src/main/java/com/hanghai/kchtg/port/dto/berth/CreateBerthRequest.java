package com.hanghai.kchtg.port.dto.berth;

import java.util.UUID;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

/**
 * Request DTO for creating a new Berth.
 * Berth code is auto-generated.
 */
@Data
public class CreateBerthRequest {

    @NotBlank(message = "Tên bến không được để trống")
    @Size(max = 255)
    private String berthName;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID portId;

    private UUID orgUnitId;

    private String waterway;
    private BigDecimal latitude;
    private BigDecimal longitude;
    @DecimalMin(value = "0.01", message = "Chiều dài phải lớn hơn 0")
    @DecimalMax(value = "2000", message = "Chiều dài tối đa 2000m")
    private BigDecimal length;

    @DecimalMin(value = "0", message = "Chiều rộng phải lớn hơn hoặc bằng 0")
    @DecimalMax(value = "500", message = "Chiều rộng tối đa 500m")
    private BigDecimal width;

    private com.hanghai.kchtg.port.entity.BerthType berthType;

    @DecimalMin(value = "3", message = "Độ sâu luồng tối thiểu 3m")
    @DecimalMax(value = "100", message = "Độ sâu luồng tối đa 100m")
    private BigDecimal channelDepth;
    private String operationalFunction;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Action (draft/submit) ────────────────────────────────────────

    @NotNull(message = "Action không được để trống (draft hoặc submit)")
    private String action;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    @Size(max = 100)
    private String locationCode;

    @Size(max = 500)
    private String detailedLocation;

    private Integer coordinateSystem;

    private Integer displayRule;

    @Size(max = 255)
    private String operator;

    @DecimalMin("0")
    private BigDecimal totalArea;

    @DecimalMin("0")
    private BigDecimal designThroughput;

    @DecimalMin("0")
    private BigDecimal currentThroughput;

    @DecimalMin("0")
    private BigDecimal maxVesselSize;

    @DecimalMin("0")
    private BigDecimal plannedThroughput;

    @DecimalMin("0")
    private BigDecimal latestCargoVolume;

    private LocalDateTime openingAnnouncementDate;

    @Size(max = 500)
    private String openingDecision;

    @Size(max = 2000)
    private String investmentAgreement;

    private Integer structureType;
}
