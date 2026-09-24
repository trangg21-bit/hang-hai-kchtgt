package com.hanghai.kchtg.beacon.dto.beacon_station;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.common.validator.Decimal20_4;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO for updating an existing BeaconStation (F-069).
 * NOTE: code and type are NOT mutable (BR-069-01, BR-069-02).
 * NOTE: longitude/latitude are NOT mutable (BR-069-03).
 * action: "draft" (mặc định, giữ trạng thái) | "submit" (gửi phê duyệt) | "approved" (Lưu và phê duyệt).
 */
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBeaconStationRequest extends FieldPresenceTrackedRequest {

    @Size(max = 200)
    private String name;

    private String type;

    @Size(max = 50)
    private String towerColor;

    @Size(max = 100)
    private String primaryLightModel;

    @DecimalMin("0.01")
    @Digits(integer = 16, fraction = 4, message = "Tầm hiệu lực ánh sáng không quá 20 chữ số (tối đa 4 số lẻ)")
    private Double lightRange;

    @DecimalMin("0.01")
    @Decimal20_4(message = "Diện tích không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal area;

    @Size(max = 1000)
    private String location;

    private UUID unitId;
    private Integer provinceId;
    private LocalDate lastRepairDate;
    private LocalDate commissionedDate;
    private Boolean isActive;

    private String action = "draft";

    private String shape;
    private String structure;
    @Decimal20_4(message = "Chiều cao tháp không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal towerHeight;
    @Decimal20_4(message = "Tâm sáng không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal lightHeight;
    private String geographicRange;
    private String backupLightModel;
    private String powerSupply;
    private Integer staffCount;
    @Decimal20_4(message = "Diện tích trạm không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal stationArea;

    private UUID seaportId;

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

    private UUID mapSymbolId;

    private Integer coordinateSystem;

    @Size(max = 255)
    private String displayRule;

    /** Tọa độ GIS dạng WKT (vd: POINT (106.7 20.8)) — chuẩn /vts-operation-center; khi sửa có thể đổi vị trí. */
    private String coordinates;

    public void setName(String name) {
        markFieldPresent("name");
        this.name = name;
    }

    public void setType(String type) {
        markFieldPresent("type");
        this.type = type;
    }

    public void setTowerColor(String towerColor) {
        markFieldPresent("towerColor");
        this.towerColor = towerColor;
    }

    public void setPrimaryLightModel(String primaryLightModel) {
        markFieldPresent("primaryLightModel");
        this.primaryLightModel = primaryLightModel;
    }

    public void setLightRange(Double lightRange) {
        markFieldPresent("lightRange");
        this.lightRange = lightRange;
    }

    public void setArea(BigDecimal area) {
        markFieldPresent("area");
        this.area = area;
    }

    public void setLocation(String location) {
        markFieldPresent("location");
        this.location = location;
    }

    public void setUnitId(UUID unitId) {
        markFieldPresent("unitId");
        this.unitId = unitId;
    }

    public void setProvinceId(Integer provinceId) {
        markFieldPresent("provinceId");
        this.provinceId = provinceId;
    }

    public void setLastRepairDate(LocalDate lastRepairDate) {
        markFieldPresent("lastRepairDate");
        this.lastRepairDate = lastRepairDate;
    }

    public void setCommissionedDate(LocalDate commissionedDate) {
        markFieldPresent("commissionedDate");
        this.commissionedDate = commissionedDate;
    }

    public void setIsActive(Boolean isActive) {
        markFieldPresent("isActive");
        this.isActive = isActive;
    }

    public void setAction(String action) {
        markFieldPresent("action");
        this.action = action;
    }

    public void setShape(String shape) {
        markFieldPresent("shape");
        this.shape = shape;
    }

    public void setStructure(String structure) {
        markFieldPresent("structure");
        this.structure = structure;
    }

    public void setTowerHeight(BigDecimal towerHeight) {
        markFieldPresent("towerHeight");
        this.towerHeight = towerHeight;
    }

    public void setLightHeight(BigDecimal lightHeight) {
        markFieldPresent("lightHeight");
        this.lightHeight = lightHeight;
    }

    public void setGeographicRange(String geographicRange) {
        markFieldPresent("geographicRange");
        this.geographicRange = geographicRange;
    }

    public void setBackupLightModel(String backupLightModel) {
        markFieldPresent("backupLightModel");
        this.backupLightModel = backupLightModel;
    }

    public void setPowerSupply(String powerSupply) {
        markFieldPresent("powerSupply");
        this.powerSupply = powerSupply;
    }

    public void setStaffCount(Integer staffCount) {
        markFieldPresent("staffCount");
        this.staffCount = staffCount;
    }

    public void setStationArea(BigDecimal stationArea) {
        markFieldPresent("stationArea");
        this.stationArea = stationArea;
    }

    public void setSeaportId(UUID seaportId) {
        markFieldPresent("seaportId");
        this.seaportId = seaportId;
    }

    public void setOperator(String operator) {
        markFieldPresent("operator");
        this.operator = operator;
    }

    public void setDetailedLocation(String detailedLocation) {
        markFieldPresent("detailedLocation");
        this.detailedLocation = detailedLocation;
    }

    public void setOperationalStatus(Integer operationalStatus) {
        markFieldPresent("operationalStatus");
        this.operationalStatus = operationalStatus;
    }

    public void setRegion(String region) {
        markFieldPresent("region");
        this.region = region;
    }

    public void setIdentifyingFeature(String identifyingFeature) {
        markFieldPresent("identifyingFeature");
        this.identifyingFeature = identifyingFeature;
    }

    public void setNote(String note) {
        markFieldPresent("note");
        this.note = note;
    }

    public void setGeometryType(String geometryType) {
        markFieldPresent("geometryType");
        this.geometryType = geometryType;
    }

    public void setMapSymbolId(UUID mapSymbolId) {
        markFieldPresent("mapSymbolId");
        this.mapSymbolId = mapSymbolId;
    }

    public void setCoordinateSystem(Integer coordinateSystem) {
        markFieldPresent("coordinateSystem");
        this.coordinateSystem = coordinateSystem;
    }

    public void setDisplayRule(String displayRule) {
        markFieldPresent("displayRule");
        this.displayRule = displayRule;
    }

    public void setCoordinates(String coordinates) {
        markFieldPresent("coordinates");
        this.coordinates = coordinates;
    }

    /**
     * Builder tự ghi nhận field-presence: mỗi phương thức gọi THẲNG setter tương ứng (setter là nơi
     * duy nhất gọi markFieldPresent), nên request tạo qua builder có đúng tập field đã truyền —
     * đồng nhất với đường JSON/Jackson của Controller.
     *
     * KHÔNG dùng Lombok {@code @Builder} ở lớp này: builder sinh tự động gán thẳng vào field, bỏ qua
     * setter nên markFieldPresent không bao giờ chạy; BeaconStationService.update() khi đó coi mọi
     * field là "không được gửi" và bỏ qua cập nhật (lỗi P1 2026-09-23 — updateSuccess,
     * updateApprovedTypeChange và các test history đều đỏ).
     */
    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {

        private final UpdateBeaconStationRequest target = new UpdateBeaconStationRequest();

        public Builder name(String value) { target.setName(value); return this; }
        public Builder type(String value) { target.setType(value); return this; }
        public Builder towerColor(String value) { target.setTowerColor(value); return this; }
        public Builder primaryLightModel(String value) { target.setPrimaryLightModel(value); return this; }
        public Builder lightRange(Double value) { target.setLightRange(value); return this; }
        public Builder area(BigDecimal value) { target.setArea(value); return this; }
        public Builder location(String value) { target.setLocation(value); return this; }
        public Builder unitId(UUID value) { target.setUnitId(value); return this; }
        public Builder provinceId(Integer value) { target.setProvinceId(value); return this; }
        public Builder lastRepairDate(LocalDate value) { target.setLastRepairDate(value); return this; }
        public Builder commissionedDate(LocalDate value) { target.setCommissionedDate(value); return this; }
        public Builder isActive(Boolean value) { target.setIsActive(value); return this; }
        public Builder action(String value) { target.setAction(value); return this; }
        public Builder shape(String value) { target.setShape(value); return this; }
        public Builder structure(String value) { target.setStructure(value); return this; }
        public Builder towerHeight(BigDecimal value) { target.setTowerHeight(value); return this; }
        public Builder lightHeight(BigDecimal value) { target.setLightHeight(value); return this; }
        public Builder geographicRange(String value) { target.setGeographicRange(value); return this; }
        public Builder backupLightModel(String value) { target.setBackupLightModel(value); return this; }
        public Builder powerSupply(String value) { target.setPowerSupply(value); return this; }
        public Builder staffCount(Integer value) { target.setStaffCount(value); return this; }
        public Builder stationArea(BigDecimal value) { target.setStationArea(value); return this; }
        public Builder seaportId(UUID value) { target.setSeaportId(value); return this; }
        public Builder operator(String value) { target.setOperator(value); return this; }
        public Builder detailedLocation(String value) { target.setDetailedLocation(value); return this; }
        public Builder operationalStatus(Integer value) { target.setOperationalStatus(value); return this; }
        public Builder region(String value) { target.setRegion(value); return this; }
        public Builder identifyingFeature(String value) { target.setIdentifyingFeature(value); return this; }
        public Builder note(String value) { target.setNote(value); return this; }
        public Builder geometryType(String value) { target.setGeometryType(value); return this; }
        public Builder mapSymbolId(UUID value) { target.setMapSymbolId(value); return this; }
        public Builder coordinateSystem(Integer value) { target.setCoordinateSystem(value); return this; }
        public Builder displayRule(String value) { target.setDisplayRule(value); return this; }
        public Builder coordinates(String value) { target.setCoordinates(value); return this; }

        public UpdateBeaconStationRequest build() {
            return target;
        }
    }
}
