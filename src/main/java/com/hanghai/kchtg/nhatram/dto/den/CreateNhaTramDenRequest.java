package com.hanghai.kchtg.nhatram.dto.den;

import com.hanghai.kchtg.nhatram.entity.BeaconLightType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Request DTO cho việc tạo mới nhà trạm đèn biển (F-086).
 * Bao gồm trường "action": "draft" → DRAFT, "submit" → PENDING_APPROVAL.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNhaTramDenRequest {

    @NotBlank(message = "Mã nhà trạm đèn không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên nhà trạm đèn không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại đèn không được để trống")
    private BeaconLightType type;

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
    private String lightColor;

    @Size(max = 100)
    private String lightCharacteristic;

    @DecimalMin("0.01")
    @DecimalMax("100.0")
    private Double range;

    @Size(max = 1000)
    private String description;

    private Long unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String action = "draft";
}
