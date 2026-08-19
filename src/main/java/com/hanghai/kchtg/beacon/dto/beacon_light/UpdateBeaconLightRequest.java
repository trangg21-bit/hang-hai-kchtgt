package com.hanghai.kchtg.beacon.dto.beacon_light;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for updating an existing BeaconLight (F-069).
 * NOTE: code and type are NOT mutable (BR-069-01, BR-069-02).
 * NOTE: longitude/latitude are NOT mutable (BR-069-03).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBeaconLightRequest {

    @Size(max = 200)
    private String name;

    private String type;



    @Size(max = 50)
    private String towerColor;

    @Size(max = 100)
    private String primaryLightModel;

    // BUG FIX #2: Added lightRange (was missing from UPDATE DTO)
    @DecimalMin("0.01")
    @DecimalMax("60.0")
    private Double lightRange;

    @DecimalMin("0.01")
    @DecimalMax("100.0")
    private Double area;

    @Size(max = 1000)
    private String location;

    private java.util.UUID unitId;
    private Integer provinceId;
    private LocalDate lastRepairDate;
    private LocalDate commissionedDate;
    private Boolean isActive;

    private String shape;
    private String structure;
    private Double towerHeight;
    private Double lightHeight;
    private String geographicRange;
    private String backupLightModel;
    private String powerSupply;
    private Integer staffCount;
    private Double stationArea;

    private java.util.UUID seaportId;

    @Size(max = 200)
    private String operator;

    @Size(max = 500)
    private String detailedLocation;

    private Integer operationalStatus;

    @Size(max = 255)
    private String region;

    @Size(max = 500)
    private String identifyingFeature;

    @Size(max = 1000)
    private String note;

    @Size(max = 20)
    private String geometryType;

    private java.util.UUID mapSymbolId;

    private Integer coordinateSystem;

    @Size(max = 255)
    private String displayRule;
}
