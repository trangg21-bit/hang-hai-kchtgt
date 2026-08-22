package com.hanghai.kchtg.station.dto.buoy;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO cho việc cập nhật nhà trạm phao tiêu (F-081).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBuoyStationRequest {

    private RecordSecurityLevel securityLevel;

    @Size(max = 255, message = "Tên nhà trạm không được vượt quá 255 ký tự")
    private String name;

    private String type;

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

    private UUID unitId;
    private UUID operatingOrgId;
    private UUID portId;
    private UUID waterwayId;
    private UUID waterwayRouteId;
    private String province;
    @Size(max = 500, message = "Địa điểm chi tiết không được vượt quá 500 ký tự")
    private String address;
    private LocalDate constructionDate;
    @Digits(integer = 20, fraction = 2, message = "Tổng diện tích không được vượt quá 20 chữ số")
    private Double totalArea;
    @Digits(integer = 20, fraction = 2, message = "Diện tích sử dụng không được vượt quá 20 chữ số")
    private Double usableArea;
    @Max(value = 99999, message = "Số lượng nhân sự bố trí không được vượt quá 5 chữ số")
    private Integer staffCount;
    private Integer lastMaintenanceYear;
    @Size(max = 2000, message = "Ghi chú không được vượt quá 2000 ký tự")
    private String note;
    private String objectType;
    private String icon;
    private String coordinateSystem;
    private String displayFormat;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private LocalDate lastRepairDate;
    @Size(max = 100, message = "Tình trạng không được vượt quá 100 ký tự")
    private String condition;
    private Boolean isActive;
    private Double latitude;
    private Double longitude;
    private GisGeometryType geometryType;
    private String coordinates;
}

