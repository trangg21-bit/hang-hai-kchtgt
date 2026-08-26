package com.hanghai.kchtg.vtsoperationcenter.dto;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemAttachmentResponse;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class VtsOperationCenterResponse {
    private UUID id;
    private String code;
    private String name;
    private UUID vtsSystemId;
    private String vtsSystemName;
    private UUID portId;
    private String portName;
    private UUID orgUnitId;
    private String orgUnitName;
    private Integer provinceId;
    private String provinceName;
    private String detailedLocation;
    private String coverage;
    private ConditionStatus conditionStatus;
    private String note;
    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;
    private ApprovalStatus approvalStatus;
    private String approvalStatusLabel;
    private UUID approverLevel1;
    private String approverLevel1Name;
    private LocalDateTime approvedDateLevel1;
    private UUID approverLevel2;
    private String approverLevel2Name;
    private LocalDateTime approvedDateLevel2;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private String createdByName;
    private UUID updatedBy;
    private String updatedByName;
    private List<VtsSystemAttachmentResponse> attachments;

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String code;
        private String name;
        private UUID vtsSystemId;
        private String vtsSystemName;
        private UUID portId;
        private String portName;
        private UUID orgUnitId;
        private String orgUnitName;
        private Integer provinceId;
        private String provinceName;
        private String detailedLocation;
        private String coverage;
        private ConditionStatus conditionStatus;
        private String note;
        private UUID spatialId;
        private GisGeometryType geometryType;
        private String coordinates;
        private UUID symbolId;
        private ApprovalStatus approvalStatus;
        private String approvalStatusLabel;
        private UUID approverLevel1;
        private String approverLevel1Name;
        private LocalDateTime approvedDateLevel1;
        private UUID approverLevel2;
        private String approverLevel2Name;
        private LocalDateTime approvedDateLevel2;
        private String rejectionReason;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private UUID createdBy;
        private String createdByName;
        private UUID updatedBy;
        private String updatedByName;
        private List<VtsSystemAttachmentResponse> attachments;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder code(String code) { this.code = code; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder vtsSystemId(UUID vtsSystemId) { this.vtsSystemId = vtsSystemId; return this; }
        public Builder vtsSystemName(String vtsSystemName) { this.vtsSystemName = vtsSystemName; return this; }
        public Builder portId(UUID portId) { this.portId = portId; return this; }
        public Builder portName(String portName) { this.portName = portName; return this; }
        public Builder orgUnitId(UUID orgUnitId) { this.orgUnitId = orgUnitId; return this; }
        public Builder orgUnitName(String orgUnitName) { this.orgUnitName = orgUnitName; return this; }
        public Builder provinceId(Integer provinceId) { this.provinceId = provinceId; return this; }
        public Builder provinceName(String provinceName) { this.provinceName = provinceName; return this; }
        public Builder detailedLocation(String detailedLocation) { this.detailedLocation = detailedLocation; return this; }
        public Builder coverage(String coverage) { this.coverage = coverage; return this; }
        public Builder conditionStatus(ConditionStatus conditionStatus) { this.conditionStatus = conditionStatus; return this; }
        public Builder note(String note) { this.note = note; return this; }
        public Builder spatialId(UUID spatialId) { this.spatialId = spatialId; return this; }
        public Builder geometryType(GisGeometryType geometryType) { this.geometryType = geometryType; return this; }
        public Builder coordinates(String coordinates) { this.coordinates = coordinates; return this; }
        public Builder symbolId(UUID symbolId) { this.symbolId = symbolId; return this; }
        public Builder approvalStatus(ApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; return this; }
        public Builder approvalStatusLabel(String approvalStatusLabel) { this.approvalStatusLabel = approvalStatusLabel; return this; }
        public Builder approverLevel1(UUID approverLevel1) { this.approverLevel1 = approverLevel1; return this; }
        public Builder approverLevel1Name(String approverLevel1Name) { this.approverLevel1Name = approverLevel1Name; return this; }
        public Builder approvedDateLevel1(LocalDateTime approvedDateLevel1) { this.approvedDateLevel1 = approvedDateLevel1; return this; }
        public Builder approverLevel2(UUID approverLevel2) { this.approverLevel2 = approverLevel2; return this; }
        public Builder approverLevel2Name(String approverLevel2Name) { this.approverLevel2Name = approverLevel2Name; return this; }
        public Builder approvedDateLevel2(LocalDateTime approvedDateLevel2) { this.approvedDateLevel2 = approvedDateLevel2; return this; }
        public Builder rejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder createdBy(UUID createdBy) { this.createdBy = createdBy; return this; }
        public Builder createdByName(String createdByName) { this.createdByName = createdByName; return this; }
        public Builder updatedBy(UUID updatedBy) { this.updatedBy = updatedBy; return this; }
        public Builder updatedByName(String updatedByName) { this.updatedByName = updatedByName; return this; }
        public Builder attachments(List<VtsSystemAttachmentResponse> attachments) { this.attachments = attachments; return this; }

        public VtsOperationCenterResponse build() {
            return new VtsOperationCenterResponse(id, code, name, vtsSystemId, vtsSystemName, portId, portName,
                    orgUnitId, orgUnitName, provinceId, provinceName, detailedLocation, coverage, conditionStatus,
                    note, spatialId, geometryType, coordinates, symbolId, approvalStatus, approvalStatusLabel,
                    approverLevel1, approverLevel1Name, approvedDateLevel1, approverLevel2, approverLevel2Name,
                    approvedDateLevel2, rejectionReason, createdAt, updatedAt, createdBy, createdByName,
                    updatedBy, updatedByName, attachments);
        }
    }
}
