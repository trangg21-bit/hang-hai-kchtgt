package com.hanghai.kchtg.port.dto.berth;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.BerthType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateBerthRequest {

    @Size(max = 50)
    private String berthCode;

    @NotBlank(message = "Tên bến không được để trống")
    @Size(max = 255)
    private String berthName;

    @NotNull(message = "Cảng biển chủ không được để trống")
    private UUID portId;

    private UUID orgUnitId;

    private String waterway;
    private UUID waterwayId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal length;
    private BigDecimal width;
    private BerthType berthType;
    private BigDecimal channelDepth;
    private String operationalFunction;
    private OperationalStatus operationalStatus;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    private Integer provinceId;

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

    private String saveAction; // DRAFT, SUBMIT, SAVE_AND_APPROVE
}
