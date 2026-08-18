package com.hanghai.kchtg.beacon.dto.buoy;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating a new Buoy (F-074).
 * Includes "action" field: "draft" → DRAFT status, "submit" → PENDING_APPROVAL.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBuoyRequest {

    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên phao tiêu không được để trống")
    @Size(max = 255)
    private String name;

    private String type;



    @Size(max = 50)
    private String color;

    @Size(max = 50)
    private String shape;

    @Size(max = 100)
    private String lightCharacteristic;

    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("100.0")
    private Double range;

    @Size(max = 1000)
    private String description;

    private Double latitude;
    private Double longitude;

    @Size(max = 20)
    private String geometryType;

    private java.util.UUID mapSymbolId;

    private Integer coordinateSystem;

    @Size(max = 255)
    private String displayRule;

    private String coordinates;

    private java.util.UUID unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;

    @Builder.Default
    private Boolean isActive = true;

    // ── Trường theo đặc tả CSV 'QL Phao tiêu' (form tạo mới) ──
    private java.util.UUID buoyStationId;

    @NotNull(message = "Phân loại không được để trống")
    @Size(max = 100)
    private String classification;

    @Size(max = 100)
    private String classificationBuoy;

    @Size(max = 100)
    private String classificationMark;

    private Integer provinceId;

    @Size(max = 500)
    private String locationDetail;

    @NotNull(message = "Tình trạng không được để trống")
    @Size(max = 100)
    private String condition;

    @Size(max = 2000)
    private String structure;

    private Double area;
    private Double bodyHeight;
    private Double diameter;

    @Size(max = 100)
    private String beaconLight;

    private Double towerHeight;

    @NotNull(message = "Chiều cao tâm sáng không được để trống")
    private Double lightHeight;

    @Size(max = 100)
    private String lightModel;

    @Size(max = 200)
    private String towerColor;

    @Size(max = 500)
    private String powerSupply;

    private LocalDate commissionedDate;
    private LocalDate lastRepairDate;

    @Size(max = 50)
    private String lightColor;

    @Size(max = 50)
    private String flashType;

    @Size(max = 50)
    private String period;

    @Builder.Default
    private String action = "draft";
}
