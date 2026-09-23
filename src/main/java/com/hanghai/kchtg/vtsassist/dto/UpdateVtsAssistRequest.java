package com.hanghai.kchtg.vtsassist.dto;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.FieldPresenceTrackedRequest;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

/**
 * Request DTO for updating an existing VTS Assist System.
 * Extends FieldPresenceTrackedRequest to distinguish between cleared (null) fields vs omitted fields.
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class UpdateVtsAssistRequest extends FieldPresenceTrackedRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private String deviceName;

    private String detailedLocation;

    private Integer quantity;

    private String manufacturer;

    private String model;

    private UUID orgUnitId;

    @NotNull(message = "Đơn vị khai thác không được để trống")
    private UUID operatingUnitId;

    private String provinceName;

    private Integer attachedInfrastructureType;
    private UUID attachedInfrastructureId;

    private Integer unitOfMeasure;
    private Integer yearOfUse;

    private OperationalStatus operationalStatus;

    @Size(max = 2000, message = "Thông số kỹ thuật tối đa 2000 ký tự")
    private String specifications;

    @Size(max = 2000, message = "Thông tin bảo trì tối đa 2000 ký tự")
    private String maintenanceInformation;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String note;

    private Integer objectType;
    private UUID mapSymbolId;
    private Integer coordinateSystem;
    private Integer displayRule;
    private UUID spatialId;

    private GisGeometryType geometryType;
    private String coordinates;

    /**
     * Trạng thái phê duyệt mới: gửi 'PENDING' để chuyển bản ghi sang chờ duyệt.
     * Khi null, bản ghi được đưa về trạng thái chờ duyệt (PENDING_APPROVAL).
     */
    private ApprovalStatus approvalStatus;

    public void setDeviceName(String deviceName) {
        markFieldPresent("deviceName");
        this.deviceName = deviceName != null ? deviceName.trim() : null;
    }

    public void setDetailedLocation(String detailedLocation) {
        markFieldPresent("detailedLocation");
        this.detailedLocation = detailedLocation != null && !detailedLocation.trim().isEmpty()
                ? detailedLocation.trim() : null;
    }

    public void setQuantity(Integer quantity) {
        markFieldPresent("quantity");
        this.quantity = quantity;
    }

    public void setManufacturer(String manufacturer) {
        markFieldPresent("manufacturer");
        this.manufacturer = manufacturer != null && !manufacturer.trim().isEmpty()
                ? manufacturer.trim() : null;
    }

    public void setModel(String model) {
        markFieldPresent("model");
        this.model = model != null && !model.trim().isEmpty()
                ? model.trim() : null;
    }

    public void setOrgUnitId(UUID orgUnitId) {
        markFieldPresent("orgUnitId");
        this.orgUnitId = orgUnitId;
    }

    public void setOperatingUnitId(UUID operatingUnitId) {
        markFieldPresent("operatingUnitId");
        this.operatingUnitId = operatingUnitId;
    }

    public void setProvinceName(String provinceName) {
        markFieldPresent("provinceName");
        this.provinceName = provinceName != null && !provinceName.trim().isEmpty()
                ? provinceName.trim() : null;
    }

    public void setAttachedInfrastructureType(Integer attachedInfrastructureType) {
        markFieldPresent("attachedInfrastructureType");
        this.attachedInfrastructureType = attachedInfrastructureType;
    }

    public void setAttachedInfrastructureId(UUID attachedInfrastructureId) {
        markFieldPresent("attachedInfrastructureId");
        this.attachedInfrastructureId = attachedInfrastructureId;
    }

    public void setUnitOfMeasure(Integer unitOfMeasure) {
        markFieldPresent("unitOfMeasure");
        this.unitOfMeasure = unitOfMeasure;
    }

    public void setYearOfUse(Integer yearOfUse) {
        markFieldPresent("yearOfUse");
        this.yearOfUse = yearOfUse;
    }

    public void setOperationalStatus(OperationalStatus operationalStatus) {
        markFieldPresent("operationalStatus");
        this.operationalStatus = operationalStatus;
    }

    public void setSpecifications(String specifications) {
        markFieldPresent("specifications");
        this.specifications = specifications != null && !specifications.trim().isEmpty()
                ? specifications.trim() : null;
    }

    public void setMaintenanceInformation(String maintenanceInformation) {
        markFieldPresent("maintenanceInformation");
        this.maintenanceInformation = maintenanceInformation != null && !maintenanceInformation.trim().isEmpty()
                ? maintenanceInformation.trim() : null;
    }

    public void setNote(String note) {
        markFieldPresent("note");
        this.note = note != null && !note.trim().isEmpty()
                ? note.trim() : null;
    }

    public void setObjectType(Integer objectType) {
        markFieldPresent("objectType");
        this.objectType = objectType;
    }

    public void setMapSymbolId(UUID mapSymbolId) {
        markFieldPresent("mapSymbolId");
        this.mapSymbolId = mapSymbolId;
    }

    public void setCoordinateSystem(Integer coordinateSystem) {
        markFieldPresent("coordinateSystem");
        this.coordinateSystem = coordinateSystem;
    }

    public void setDisplayRule(Integer displayRule) {
        markFieldPresent("displayRule");
        this.displayRule = displayRule;
    }

    public void setSpatialId(UUID spatialId) {
        markFieldPresent("spatialId");
        this.spatialId = spatialId;
    }

    public void setGeometryType(GisGeometryType geometryType) {
        markFieldPresent("geometryType");
        this.geometryType = geometryType;
    }

    public void setCoordinates(String coordinates) {
        markFieldPresent("coordinates");
        this.coordinates = coordinates != null && !coordinates.trim().isEmpty()
                ? coordinates.trim() : null;
    }

    public void setApprovalStatus(ApprovalStatus approvalStatus) {
        markFieldPresent("approvalStatus");
        this.approvalStatus = approvalStatus;
    }
}
