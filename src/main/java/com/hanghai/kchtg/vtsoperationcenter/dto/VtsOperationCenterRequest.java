package com.hanghai.kchtg.vtsoperationcenter.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

@Data
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

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String code;
        private String name;
        private UUID vtsSystemId;
        private UUID portId;
        private UUID orgUnitId;
        private Integer provinceId;
        private String detailedLocation;
        private String coverage;
        private ConditionStatus conditionStatus;
        private String note;
        private UUID spatialId;
        private GisGeometryType geometryType;
        private String coordinates;
        private UUID symbolId;
        private ApprovalStatus approvalStatus;

        public Builder code(String code) { this.code = code; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder vtsSystemId(UUID vtsSystemId) { this.vtsSystemId = vtsSystemId; return this; }
        public Builder portId(UUID portId) { this.portId = portId; return this; }
        public Builder orgUnitId(UUID orgUnitId) { this.orgUnitId = orgUnitId; return this; }
        public Builder provinceId(Integer provinceId) { this.provinceId = provinceId; return this; }
        public Builder detailedLocation(String detailedLocation) { this.detailedLocation = detailedLocation; return this; }
        public Builder coverage(String coverage) { this.coverage = coverage; return this; }
        public Builder conditionStatus(ConditionStatus conditionStatus) { this.conditionStatus = conditionStatus; return this; }
        public Builder note(String note) { this.note = note; return this; }
        public Builder spatialId(UUID spatialId) { this.spatialId = spatialId; return this; }
        public Builder geometryType(GisGeometryType geometryType) { this.geometryType = geometryType; return this; }
        public Builder coordinates(String coordinates) { this.coordinates = coordinates; return this; }
        public Builder symbolId(UUID symbolId) { this.symbolId = symbolId; return this; }
        public Builder approvalStatus(ApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; return this; }

        public VtsOperationCenterRequest build() {
            return new VtsOperationCenterRequest(code, name, vtsSystemId, portId, orgUnitId, provinceId,
                    detailedLocation, coverage, conditionStatus, note, spatialId, geometryType, coordinates, symbolId, approvalStatus);
        }
    }
}
