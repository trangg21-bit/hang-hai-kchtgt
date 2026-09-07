package com.hanghai.kchtg.scada.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;


/**
 * Request DTO for creating a new SCADA system.
 */
@Data
public class CreateScadaRequest {

    @NotBlank(message = "Mã thiết bị không được để trống")
    @Size(max = 200, message = "Mã thiết bị tối đa 200 ký tự")
    private String deviceCode;

    @NotBlank(message = "Tên thiết bị không được để trống")
    @Size(max = 255, message = "Tên thiết bị tối đa 255 ký tự")
    private String deviceName;

    @Size(max = 500, message = "Địa điểm chi tiết tối đa 500 ký tự")
    private String detailedLocation;

    @NotNull(message = "Số lượng không được để trống")
    private Integer quantity;

    @Size(max = 50, message = "Hãng sản xuất tối đa 50 ký tự")
    private String manufacturer;

    @Size(max = 255, message = "Model tối đa 255 ký tự")
    private String model;

    private UUID orgUnitId;
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
     * Hành động khi tạo: 'draft' (Lưu tạm) | 'submit' (Gửi duyệt — mặc định) | 'approve' (Lưu và phê duyệt).
     * Cơ chế giống màn /port (CreatePortRequest.action).
     */
    private String action;
}
