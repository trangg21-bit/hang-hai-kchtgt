package com.hanghai.kchtg.radarstation.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
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
public class RadarStationUpdateRequest {
    @Size(max = 255, message = "Tên trạm không được vượt quá 255 ký tự")
    private String stationName;

    @Size(max = 500, message = "Vị trí không được vượt quá 500 ký tự")
    private String location;

    private BigDecimal longitude;
    private BigDecimal latitude;
    private String stationType;
    private String coverage;
    private BigDecimal emissionArea;
    private String source;

    /** Tình trạng: '0' / '1' / '2' — khớp dashboard. */
    private String conditionStatus;

    private UUID orgUnitId;
    private UUID seaportId;
    private UUID vtsSystemId;
    private UUID vtsOperationCenterId;
    private UUID operatingUnitId;
    private Integer provinceId;
    private String unitOfMeasure;

    private Integer quantity;

    private BigDecimal towerHeight;
    private BigDecimal radarRange;

    @Size(max = 2000, message = "Ghi chú không được vượt quá 2000 ký tự")
    private String note;

    private GisGeometryType geometryType;
    private String coordinates;
    private String mapIcon;

    /** Hành động lưu: "draft" hoặc "submit". Mặc định "draft". */
    private String action;
}
