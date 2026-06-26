package com.hanghai.kchtg.nhatram.dto.phao;

import com.hanghai.kchtg.nhatram.entity.BuoyType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO cho việc tạo mới nhà trạm phao tiêu (F-080).
 * Bao gồm trường "action": "draft" → DRAFT, "submit" → PENDING_APPROVAL.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNhaTramPhaoRequest {

    @NotBlank(message = "Mã nhà trạm phao không được để trống")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Tên nhà trạm phao không được để trống")
    @Size(max = 200)
    private String name;

    @NotNull(message = "Loại phao không được để trống")
    private BuoyType type;

    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double latitude;

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double longitude;

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

    private Long unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String action = "draft";
}
