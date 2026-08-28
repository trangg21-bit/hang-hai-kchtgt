package com.hanghai.kchtg.vtsassist.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;

/**
 * Request DTO for updating an existing VTS Assist System.
 */
@Data
public class UpdateVtsAssistRequest {

    @NotNull(message = "ID không được để trống")
    private UUID id;

    private RecordSecurityLevel securityLevel;

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
     * Trạng thái phê duyệt mới (giống màn /port): gửi 'PENDING' để chuyển bản ghi sang chờ duyệt.
     * Khi null, bản ghi được đưa về trạng thái chờ duyệt (PENDING_APPROVAL).
     */
    private ApprovalStatus approvalStatus;
}
