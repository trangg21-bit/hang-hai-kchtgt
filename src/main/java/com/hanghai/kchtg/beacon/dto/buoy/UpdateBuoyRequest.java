package com.hanghai.kchtg.beacon.dto.buoy;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for updating an existing Buoy (F-075).
 * NOTE: code and type are NOT mutable (BR-075-01, BR-075-02).
 * NOTE: longitude/latitude are NOT mutable (BR-075-03).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBuoyRequest {

    @Size(max = 255)
    private String name;

    private String type;



    @Size(max = 50)
    private String color;

    @Size(max = 50)
    private String shape;

    @Size(max = 100)
    private String lightCharacteristic;

    @DecimalMin("0.01")
    @DecimalMax("100.0")
    private Double range;

    @Size(max = 1000)
    private String description;

    private Double latitude;
    private Double longitude;

    private String geometryType;

    private java.util.UUID mapSymbolId;

    private Integer coordinateSystem;

    private String displayRule;

    private String coordinates;

    private java.util.UUID unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private Boolean isActive;

    // ── Trường theo đặc tả CSV 'QL Phao tiêu' (form chỉnh sửa) ──
    private java.util.UUID buoyStationId;
    private String classification;
    private String classificationBuoy;
    private String classificationMark;
    private Integer provinceId;
    private String locationDetail;
    private String condition;
    @Size(max = 2000)
    private String structure;
    private Double area;
    private Double bodyHeight;
    private Double diameter;
    private String beaconLight;
    private Double towerHeight;
    private Double lightHeight;
    @Size(max = 100)
    private String lightModel;
    private String towerColor;
    private String powerSupply;
    private LocalDate commissionedDate;
    private LocalDate lastRepairDate;
    @Size(max = 50)
    private String lightColor;
    @Size(max = 50)
    private String flashType;
    @Size(max = 50)
    private String period;
}
