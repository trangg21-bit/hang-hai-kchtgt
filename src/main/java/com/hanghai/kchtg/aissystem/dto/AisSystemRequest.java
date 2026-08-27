package com.hanghai.kchtg.aissystem.dto;

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
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class AisSystemRequest {

    @NotBlank(message = "Mã thiết bị không được để trống")
    @Size(max = 50, message = "Mã thiết bị tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên thiết bị không được để trống")
    @Size(max = 255, message = "Tên thiết bị tối đa 255 ký tự")
    private String name;

    private UUID vtsOperationCenterId;

    private UUID radarStationId;

    @NotNull(message = "Đơn vị khai thác không được để trống")
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
}
