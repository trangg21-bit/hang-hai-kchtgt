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

    @NotNull(message = "Vĩ độ không được để trống")
    @DecimalMin(value = "-90.0", message = "Vĩ độ phải lớn hơn hoặc bằng -90.0")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải nhỏ hơn hoặc bằng 90.0")
    private Double latitude;

    @NotNull(message = "Kinh độ không được để trống")
    @DecimalMin(value = "-180.0", message = "Kinh độ phải lớn hơn hoặc bằng -180.0")
    @DecimalMax(value = "180.0", message = "Kinh độ phải nhỏ hơn hoặc bằng 180.0")
    private Double longitude;

    @Size(max = 50, message = "Màu sắc không được vượt quá 50 ký tự")
    private String color;

    @Size(max = 50, message = "Hình dáng không được vượt quá 50 ký tự")
    private String shape;

    @Size(max = 100, message = "Đặc tính ánh sáng không được vượt quá 100 ký tự")
    private String lightCharacteristic;

    @NotNull(message = "Tầm nhìn xa không được để trống")
    @DecimalMin(value = "0.01", message = "Tầm nhìn xa phải lớn hơn hoặc bằng 0.01 hải lý")
    @DecimalMax(value = "100.0", message = "Tầm nhìn xa phải nhỏ hơn hoặc bằng 100.0 hải lý")
    private Double range;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String description;

    private java.util.UUID unitId;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String action = "draft";

    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
