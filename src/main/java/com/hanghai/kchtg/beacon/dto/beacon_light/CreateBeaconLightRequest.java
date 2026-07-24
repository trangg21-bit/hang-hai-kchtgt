package com.hanghai.kchtg.beacon.dto.beacon_light;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating a new BeaconLight (F-068).
 * Includes "action" field: "draft" → DRAFT status, "submit" → PENDING_APPROVAL.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBeaconLightRequest {

    @NotBlank(message = "Mã đèn biển không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên đèn biển không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại đèn không được để trống")
    private String type;

    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double latitude;

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double longitude;

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
}
