package com.hanghai.kchtg.vtsoperationcenter.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
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
public class VtsOperationCenterRequest {

    @NotBlank(message = "Mã trung tâm điều hành VTS không được để trống")
    @Size(max = 50, message = "Mã trung tâm tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên trung tâm điều hành VTS không được để trống")
    @Size(max = 255, message = "Tên trung tâm tối đa 255 ký tự")
    private String name;

    @NotNull(message = "Thuộc hệ thống VTS không được để trống")
    private UUID vtsSystemId;

    private UUID portId;

    @NotNull(message = "Đơn vị quản lý không được để trống")
    private UUID orgUnitId;

    @NotNull(message = "Địa điểm (Tỉnh/Thành phố) không được để trống")
    private Integer provinceId;

    @Size(max = 500, message = "Địa điểm chi tiết tối đa 500 ký tự")
    private String detailedLocation;

    @Size(max = 255, message = "Vùng phủ sóng tối đa 255 ký tự")
    private String coverage;

    @NotNull(message = "Tình trạng không được để trống")
    private ConditionStatus conditionStatus;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String note;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;
    private ApprovalStatus approvalStatus;
}
