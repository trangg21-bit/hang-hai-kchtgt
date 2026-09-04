package com.hanghai.kchtg.radarstation.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationCreateRequest {

    @NotBlank(message = "Tên trạm Radar không được để trống")
    @Size(max = 255, message = "Tên trạm không được vượt quá 255 ký tự")
    private String stationName;

    @NotBlank(message = "Vị trí không được để trống")
    @Size(max = 500, message = "Vị trí không được vượt quá 500 ký tự")
    private String location;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal longitude;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal latitude;

    private String stationType;
    private String coverage;

    @Positive(message = "Diện tích phải là số dương")
    private BigDecimal emissionArea;

    private String source;

    /** Tình trạng (khớp dashboard KchtAssetCountService): '0' = Ngừng khai thác/vận hành (suspended), '1' = Đang khai thác/vận hành (operating), '2' = Chưa khai thác/vận hành (pending). Mặc định '1'. */
    private String conditionStatus;

    private UUID orgUnitId;
    private UUID seaportId;
    private UUID vtsSystemId;
    private UUID vtsOperationCenterId;
    private UUID operatingUnitId;
    private Integer provinceId;
    private String unitOfMeasure;

    @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
    @Max(value = 99999, message = "Số lượng tối đa 5 chữ số")
    private Integer quantity;

    private BigDecimal towerHeight;
    private BigDecimal radarRange;

    @Size(max = 2000, message = "Ghi chú không được vượt quá 2000 ký tự")
    private String note;

    private GisGeometryType geometryType;
    private String coordinates;
    private String mapIcon;

    /** Hành động lưu: "draft" (Lưu tạm) hoặc "submit" (Lưu và gửi phê duyệt). Mặc định "draft". */
    private String action;
}
