package com.hanghai.kchtg.nhatram.dto.den;

import com.hanghai.kchtg.nhatram.entity.BeaconLightType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Request DTO cho việc cập nhật nhà trạm đèn biển (F-087).
 * NOTE: code và type KHÔNG được phép sửa đổi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateNhaTramDenRequest {

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
