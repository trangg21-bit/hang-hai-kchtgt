package com.hanghai.kchtg.station.dto.lighthouse;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO cho việc cập nhật nhà trạm đèn biển (F-087).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateLighthouseStationRequest {

    @Size(max = 200)
    private String name;

    private String type;

    @DecimalMin(value = "-180.0", message = "Kinh độ phải lớn hơn hoặc bằng -180.0")
    @DecimalMax(value = "180.0", message = "Kinh độ phải nhỏ hơn hoặc bằng 180.0")
    private Double longitude;

    @DecimalMin(value = "-90.0", message = "Vĩ độ phải lớn hơn hoặc bằng -90.0")
    @DecimalMax(value = "90.0", message = "Vĩ độ phải nhỏ hơn hoặc bằng 90.0")
    private Double latitude;

    @Size(max = 50, message = "Màu ánh sáng không được vượt quá 50 ký tự")
    private String lightColor;

    @Size(max = 100, message = "Đặc tính ánh sáng không được vượt quá 100 ký tự")
    private String lightCharacteristic;

    @DecimalMin(value = "0.01", message = "Tầm hiệu lực ánh sáng phải lớn hơn hoặc bằng 0.01 hải lý")
    @DecimalMax(value = "60.0", message = "Tầm hiệu lực ánh sáng phải nhỏ hơn hoặc bằng 60.0 hải lý")
    private Double lightRange;

    @DecimalMin(value = "0.01", message = "Tầm nhìn xa phải lớn hơn hoặc bằng 0.01 hải lý")
    @DecimalMax(value = "100.0", message = "Tầm nhìn xa phải nhỏ hơn hoặc bằng 100.0 hải lý")
    private Double range;

    @Size(max = 1000)
    private String description;

    private java.util.UUID unitId;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
    private Boolean isActive;

    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
}
