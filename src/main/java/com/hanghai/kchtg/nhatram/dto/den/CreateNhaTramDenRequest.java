package com.hanghai.kchtg.nhatram.dto.den;

import com.hanghai.kchtg.nhatram.entity.BeaconLightType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @NotNull(message = "Vĩ độ không được để trống")
    @DecimalMin(value = "-90.0", message = "Vĩ độ phải lớn hơn hoặc bằng -90.0")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải nhỏ hơn hoặc bằng 90.0")
    private Double latitude;

    @NotNull(message = "Kinh độ không được để trống")
    @DecimalMin(value = "-180.0", message = "Kinh độ phải lớn hơn hoặc bằng -180.0")
    @DecimalMax(value = "180.0", message = "Kinh độ phải nhỏ hơn hoặc bằng 180.0")
    private Double longitude;

    @NotNull(message = "Tầm hiệu lực ánh sáng không được để trống")
    @DecimalMin(value = "0.01", message = "Tầm hiệu lực ánh sáng phải lớn hơn hoặc bằng 0.01 hải lý")
    @DecimalMax(value = "60.0", message = "Tầm hiệu lực ánh sáng phải nhỏ hơn hoặc bằng 60.0 hải lý")
    private Double lightRange;

    @Size(max = 50, message = "Màu ánh sáng không được vượt quá 50 ký tự")
    private String lightColor;

    @Size(max = 100, message = "Đặc tính ánh sáng không được vượt quá 100 ký tự")
    private String lightCharacteristic;

    @DecimalMin(value = "0.01", message = "Tầm nhìn xa phải lớn hơn hoặc bằng 0.01 hải lý")
    @DecimalMax(value = "100.0", message = "Tầm nhìn xa phải nhỏ hơn hoặc bằng 100.0 hải lý")
    private Double range;

    @Size(max = 1000)
    private String description;

    private java.util.UUID unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String action = "draft";

    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
