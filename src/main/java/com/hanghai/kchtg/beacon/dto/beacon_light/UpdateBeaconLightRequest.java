package com.hanghai.kchtg.beacon.dto.beacon_light;

import com.hanghai.kchtg.beacon.entity.BeaconLightType;
import jakarta.validation.constraints.*;
import lombok.*;

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

    private BeaconLightType type;

    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double longitude;

    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double latitude;

    @Size(max = 50)
    private String lightColor;

    @Size(max = 100)
    private String lightCharacteristic;

    // BUG FIX #2: Added lightRange (was missing from UPDATE DTO)
    @DecimalMin("0.01")
    @DecimalMax("60.0")
    private Double lightRange;

    @DecimalMin("0.01")
    @DecimalMax("100.0")
    private Double range;

    @Size(max = 1000)
    private String description;

    private Long unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private Boolean isActive;
}
