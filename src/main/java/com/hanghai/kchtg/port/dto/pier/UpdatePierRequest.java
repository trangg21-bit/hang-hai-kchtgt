package com.hanghai.kchtg.port.dto.pier;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.PierType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdatePierRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String pierName;
    private UUID berthId;
    @Positive(message = "Chiều dài phải là số dương")
    @DecimalMax(value = "500.0", message = "Chiều dài không vượt quá 500m")
    private BigDecimal length;

    @Positive(message = "Tải trọng thiết kế phải là số dương")
    @DecimalMax(value = "20.0", message = "Tải trọng thiết kế không vượt quá 20 T/m²")
    private BigDecimal designLoad;
    private PierType pierType;
    private String operationalFunction;
    private OperationalStatus operationalStatus;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID mapSymbolId;

    // ── Spec Group A: Basic info ──
    private UUID portId;
    private UUID navigationChannelId;
    private String province;
    @Size(max = 500, message = "Địa điểm chi tiết không vượt quá 500 ký tự")
    private String detailedLocation;
    private Integer constructionGrade;
    private Integer structureType;
    private Integer conditionStatus;

    // ── Spec Group B: Technical ──
    @Positive(message = "Chiều rộng phải là số dương")
    @DecimalMax(value = "500.0", message = "Chiều rộng không vượt quá 500m")
    private BigDecimal width;
    @Size(max = 20, message = "Độ sâu khu nước hiện tại không vượt quá 20 ký tự")
    private String currentWaterDepth;
    @Size(max = 20, message = "Cao độ đáy bến thiết kế không vượt quá 20 ký tự")
    private String designBedElevation;
    @Size(max = 20, message = "Cỡ tàu khai thác không vượt quá 20 ký tự")
    private String publishedVesselDWT;

    // ── Spec Group C: Dates ──
    @Size(max = 7, message = "Thời điểm phê duyệt quy trình bảo trì không hợp lệ")
    private String maintenanceApprovalDate;
    @Size(max = 7, message = "Thời điểm chấp thuận đánh giá ATCT không hợp lệ")
    private String safetyAssessmentDate;
    @Size(max = 7, message = "Thời điểm kiểm định gần nhất không hợp lệ")
    private String lastInspectionDate;

    // ── Spec Group D: Quantities ──
    private Integer operatingPierCount;
    private Integer publishedPierCount;
    private Integer investmentAgreementPierCount;
    private BigDecimal cargoThroughput;

    // ── Spec Group E: ATHH ──
    private Boolean receivesLargeVessel;
    @Size(max = 200, message = "Số văn bản không vượt quá 200 ký tự")
    private String documentNumber;
    private LocalDate documentDate;

    // ── Spec Group F: Opening announcement ──
    private LocalDate openingAnnouncementDate;
    @Size(max = 200, message = "Quyết định công bố không vượt quá 200 ký tự")
    private String openingDecision;
    @Size(max = 2000, message = "Văn bản thỏa thuận đầu tư không vượt quá 2000 ký tự")
    private String investmentAgreementDoc;

    // ── Spec Group G: GIS additional ──
    @Size(max = 2000, message = "Phạm vi khu nước neo buộc tàu không vượt quá 2000 ký tự")
    private String waterAreaNeutralScope;

    private Integer coordinateSystem;
    private String displayRule;

    private String saveAction; // DRAFT, SUBMIT, SAVE_AND_APPROVE, APPROVED
}
