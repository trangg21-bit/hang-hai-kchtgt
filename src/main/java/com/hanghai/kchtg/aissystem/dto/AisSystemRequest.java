package com.hanghai.kchtg.aissystem.dto;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.UnitOfMeasure;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class AisSystemRequest extends FieldPresenceTrackedRequest {



    @NotBlank(message = "Mã thiết bị không được để trống")
    @Size(max = 50, message = "Mã thiết bị tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên thiết bị không được để trống")
    @Size(max = 255, message = "Tên thiết bị tối đa 255 ký tự")
    private String name;

    private UUID vtsOperationCenterId;

    private UUID radarStationId;

    private UUID operatingOrgId;

    @NotNull(message = "Đơn vị quản lý không được để trống")
    private UUID orgUnitId;

    private Integer provinceId;

    @Size(max = 500, message = "Địa điểm chi tiết tối đa 500 ký tự")
    private String detailedLocation;

    @NotNull(message = "Đơn vị tính không được để trống")
    private UnitOfMeasure unitOfMeasure;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng tối thiểu là 1")
    private Integer quantity;

    @Size(max = 100, message = "Model tối đa 100 ký tự")
    private String model;

    @Size(max = 1000, message = "Thông số kỹ thuật tối đa 1000 ký tự")
    private String specifications;

    @Size(max = 255, message = "Hãng sản xuất tối đa 255 ký tự")
    private String manufacturer;

    private Integer commissioningYear;

    @NotNull(message = "Tình trạng không được để trống")
    private ConditionStatus conditionStatus;

    @Size(max = 2000, message = "Thông tin bảo trì tối đa 2000 ký tự")
    private String maintenanceInfo;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String note;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private String symbolId;
    private ApprovalStatus approvalStatus;
    /** Chỉ dùng khi tạo mới để tạo và gửi duyệt trong cùng transaction. */
    private boolean submitForApproval;

    public void setVtsOperationCenterId(UUID value) {
        markFieldPresent("vtsOperationCenterId");
        this.vtsOperationCenterId = value;
    }

    public void setRadarStationId(UUID value) {
        markFieldPresent("radarStationId");
        this.radarStationId = value;
    }

    public void setProvinceId(Integer value) {
        markFieldPresent("provinceId");
        this.provinceId = value;
    }

    public void setDetailedLocation(String value) {
        markFieldPresent("detailedLocation");
        this.detailedLocation = value;
    }

    public void setModel(String value) {
        markFieldPresent("model");
        this.model = value;
    }

    public void setSpecifications(String value) {
        markFieldPresent("specifications");
        this.specifications = value;
    }

    public void setManufacturer(String value) {
        markFieldPresent("manufacturer");
        this.manufacturer = value;
    }

    public void setCommissioningYear(Integer value) {
        markFieldPresent("commissioningYear");
        this.commissioningYear = value;
    }

    public void setMaintenanceInfo(String value) {
        markFieldPresent("maintenanceInfo");
        this.maintenanceInfo = value;
    }

    public void setNote(String value) {
        markFieldPresent("note");
        this.note = value;
    }

    public void setSpatialId(UUID value) {
        markFieldPresent("spatialId");
        this.spatialId = value;
    }

    public void setGeometryType(GisGeometryType value) {
        markFieldPresent("geometryType");
        this.geometryType = value;
    }

    public void setCoordinates(String value) {
        markFieldPresent("coordinates");
        this.coordinates = value;
    }

    public void setSymbolId(String value) {
        markFieldPresent("symbolId");
        this.symbolId = value;
    }

    public void setApprovalStatus(ApprovalStatus value) {
        markFieldPresent("approvalStatus");
        this.approvalStatus = value;
    }

    // ── Presence-tracking cho các trường còn thiếu ────────────────────────────────────────────
    // Không đăng ký presence thì `EntityUpdateUtils.copyPropertiesIfPresent` coi giá trị null là
    // "client không gửi" và BỎ QUA ⇒ người dùng xóa trắng trường nhưng giá trị cũ vẫn được giữ.
    public void setCode(String value) {
        markFieldPresent("code");
        this.code = value;
    }

    public void setName(String value) {
        markFieldPresent("name");
        this.name = value;
    }

    public void setOperatingOrgId(UUID value) {
        markFieldPresent("operatingOrgId");
        this.operatingOrgId = value;
    }

    public void setOrgUnitId(UUID value) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = value;
    }

    public void setUnitOfMeasure(UnitOfMeasure value) {
        markFieldPresent("unitOfMeasure");
        this.unitOfMeasure = value;
    }

    public void setQuantity(Integer value) {
        markFieldPresent("quantity");
        this.quantity = value;
    }

    public void setConditionStatus(ConditionStatus value) {
        markFieldPresent("conditionStatus");
        this.conditionStatus = value;
    }
}
