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

    @DecimalMin(value = "-180.0", message = "Kinh độ phải lớn hơn hoặc bằng -180.0")
    @DecimalMax(value = "180.0", message = "Kinh độ phải nhỏ hơn hoặc bằng 180.0")
    private Double longitude;

    @DecimalMin(value = "-90.0", message = "Vĩ độ phải lớn hơn hoặc bằng -90.0")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải nhỏ hơn hoặc bằng 90.0")
    private Double latitude;

    @Size(max = 50, message = "Màu sắc không được vượt quá 50 ký tự")
    private String color;

    @Size(max = 50, message = "Hình dáng không được vượt quá 50 ký tự")
    private String shape;

    @Size(max = 100, message = "Đặc tính ánh sáng không được vượt quá 100 ký tự")
    private String lightCharacteristic;

    @DecimalMin(value = "0.01", message = "Tầm nhìn xa phải lớn hơn hoặc bằng 0.01 hải lý")
    @DecimalMax(value = "100.0", message = "Tầm nhìn xa phải nhỏ hơn hoặc bằng 100.0 hải lý")
    private Double range;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String description;

    private java.util.UUID unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private Boolean isActive;
}
