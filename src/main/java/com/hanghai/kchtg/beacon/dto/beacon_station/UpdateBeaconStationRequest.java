package com.hanghai.kchtg.beacon.dto.beacon_station;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for updating an existing BeaconStation (F-069).
 * NOTE: code and type are NOT mutable (BR-069-01, BR-069-02).
 * NOTE: longitude/latitude are NOT mutable (BR-069-03).
 * action: "draft" (mặc định, giữ trạng thái) | "submit" (gửi phê duyệt) | "approved" (Lưu và phê duyệt).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBeaconStationRequest {

    @Size(max = 200)
    private String name;

    private String type;



    @Size(max = 50)
    private String towerColor;

    @Size(max = 100)
    private String primaryLightModel;

    // BUG FIX #2: Added lightRange (was missing from UPDATE DTO)
    @DecimalMin("0.01")
    @Digits(integer = 16, fraction = 4, message = "Tầm hiệu lực ánh sáng không quá 20 chữ số (tối đa 4 số lẻ)")
    private Double lightRange;

    @DecimalMin("0.01")
    @Digits(integer = 16, fraction = 4, message = "Diện tích không quá 20 chữ số (tối đa 4 số lẻ)")
    private Double area;

    @Size(max = 1000)
    private String location;

    private java.util.UUID unitId;
    private Integer provinceId;
    private LocalDate lastRepairDate;
    private LocalDate commissionedDate;
    private Boolean isActive;

    @Builder.Default
    private String action = "draft";

    private String shape;
    private String structure;
    @Digits(integer = 16, fraction = 4, message = "Chiều cao tháp không quá 20 chữ số (tối đa 4 số lẻ)")
    private Double towerHeight;
    @Digits(integer = 16, fraction = 4, message = "Tâm sáng không quá 20 chữ số (tối đa 4 số lẻ)")
    private Double lightHeight;
    private String geographicRange;
    private String backupLightModel;
    private String powerSupply;
    private Integer staffCount;
    @Digits(integer = 16, fraction = 4, message = "Diện tích trạm không quá 20 chữ số (tối đa 4 số lẻ)")
    private Double stationArea;

    private java.util.UUID seaportId;

    @Size(max = 200)
    private String operator;

    @Size(max = 500)
    private String detailedLocation;

    private Integer operationalStatus;

    @Size(max = 255)
    private String region;

    @Size(max = 500)
    private String identifyingFeature;

    @Size(max = 1000)
    private String note;

    @Size(max = 20)
    private String geometryType;

    private java.util.UUID mapSymbolId;

    private Integer coordinateSystem;

    @Size(max = 255)
    private String displayRule;

    /** Tọa độ GIS dạng WKT (vd: POINT (106.7 20.8)) — chuẩn /vts-operation-center; khi sửa có thể đổi vị trí. */
    private String coordinates;
}
