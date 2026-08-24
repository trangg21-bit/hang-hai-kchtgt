package com.hanghai.kchtg.beacon.dto.beacon_station;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating a new BeaconStation (F-068).
 * Includes "action" field: "draft" → DRAFT status, "submit" → PENDING_APPROVAL.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBeaconStationRequest {

    private RecordSecurityLevel securityLevel;

    @NotBlank(message = "Mã đèn biển không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên đèn biển không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại đèn không được để trống")
    private String type;



    @NotNull
    @DecimalMin("0.01")
    @DecimalMax("60.0")
    private Double lightRange;

    @Size(max = 50)
    private String towerColor;

    @Size(max = 100)
    private String primaryLightModel;

    @DecimalMin("0.01")
    @DecimalMax("100.0")
    private Double area;

    @Size(max = 1000)
    private String location;

    private java.util.UUID unitId;
    private Integer provinceId;
    private LocalDate lastRepairDate;
    private LocalDate commissionedDate;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String action = "draft";

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
