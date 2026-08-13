package com.hanghai.kchtg.port.dto.pier;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.port.entity.PierType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreatePierRequest {

    @NotBlank(message = "Mã cầu không được để trống")
    @Size(max = 50)
    private String pierCode;

    @NotBlank(message = "Tên cầu không được để trống")
    @Size(max = 255)
    private String pierName;

    @NotNull(message = "Bến cảng chủ không được để trống")
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
    private UUID portId;                                    // #2 - Thuộc cảng biển
    private UUID navigationChannelId;                       // #4 - Thuộc luồng hàng hải
    private String province;                                // #7 - Địa điểm (Tỉnh/TP)
    @Size(max = 500, message = "Địa điểm chi tiết không vượt quá 500 ký tự")
    private String detailedLocation;                        // #8 - Địa điểm chi tiết
    private Integer constructionGrade;                      // #9 - Phân cấp công trình
    private Integer structureType;                          // #10 - Loại kết cấu
    private Integer conditionStatus;                        // #12 - Tình trạng (default 1)

    // ── Spec Group B: Technical ──
    @Positive(message = "Chiều rộng phải là số dương")
    @DecimalMax(value = "500.0", message = "Chiều rộng không vượt quá 500m")
    private BigDecimal width;                               // #14 - Chiều rộng
    @Size(max = 20, message = "Độ sâu khu nước hiện tại không vượt quá 20 ký tự")
    private String currentWaterDepth;                       // #15
    @Size(max = 20, message = "Cao độ đáy bến thiết kế không vượt quá 20 ký tự")
    private String designBedElevation;                      // #16
    @Size(max = 20, message = "Cỡ tàu khai thác không vượt quá 20 ký tự")
    private String publishedVesselDWT;                      // #17

    // ── Spec Group C: Dates ──
    @Size(max = 7, message = "Thời điểm phê duyệt quy trình bảo trì không hợp lệ")
    private String maintenanceApprovalDate;                 // #18 - MM/YYYY
    @Size(max = 7, message = "Thời điểm chấp thuận đánh giá ATCT không hợp lệ")
    private String safetyAssessmentDate;                    // #19 - MM/YYYY
    @Size(max = 7, message = "Thời điểm kiểm định gần nhất không hợp lệ")
    private String lastInspectionDate;                      // #20 - MM/YYYY

    // ── Spec Group D: Quantities ──
    @Max(value = 99999, message = "Số lượng CC đang khai thác không vượt quá 5 chữ số")
    private Integer operatingPierCount;                     // #21
    @Max(value = 99999, message = "Số lượng CC đã công bố không vượt quá 5 chữ số")
    private Integer publishedPierCount;                     // #22
    @Max(value = 99999, message = "Số lượng CC đang thỏa thuận đầu tư không vượt quá 5 chữ số")
    private Integer investmentAgreementPierCount;           // #23
    private BigDecimal cargoThroughput;                     // #24

    // ── Spec Group E: ATHH ──
    private Boolean receivesLargeVessel;                    // #25 - 0/1
    @Size(max = 200, message = "Số văn bản không vượt quá 200 ký tự")
    private String documentNumber;                          // #26
    private LocalDate documentDate;                         // #27

    // ── Spec Group F: Opening announcement ──
    private LocalDate openingAnnouncementDate;              // #28
    @Size(max = 200, message = "Quyết định công bố không vượt quá 200 ký tự")
    private String openingDecision;                         // #29
    @Size(max = 2000, message = "Văn bản thỏa thuận đầu tư không vượt quá 2000 ký tự")
    private String investmentAgreementDoc;                  // #30

    // ── Spec Group G: GIS additional ──
    @Size(max = 2000, message = "Phạm vi khu nước neo buộc tàu không vượt quá 2000 ký tự")
    private String waterAreaNeutralScope;                   // G4

    private Integer coordinateSystem;
    private String displayRule;

    private String saveAction; // DRAFT, SUBMIT, SAVE_AND_APPROVE, APPROVED
}
