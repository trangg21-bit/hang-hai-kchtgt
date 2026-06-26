package com.hanghai.kchtg.nhatram.dto.phao;

import com.hanghai.kchtg.nhatram.entity.BuoyType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO cho việc cập nhật nhà trạm phao tiêu (F-081).
 * NOTE: code và type KHÔNG được phép sửa đổi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateNhaTramPhaoRequest {

    @Size(max = 200)
    private String name;

    private BuoyType type;

    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double longitude;

    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double latitude;

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

    private Long unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private Boolean isActive;
}
