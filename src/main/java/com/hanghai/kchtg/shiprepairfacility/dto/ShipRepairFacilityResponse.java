package com.hanghai.kchtg.shiprepairfacility.dto;

import java.util.UUID;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityResponse {

    private UUID id;
    private String facilityName;
    private String address;
    private String province;
    private String phone;
    private String email;
    private com.hanghai.kchtg.shiprepairfacility.entity.FacilityType facilityType;
    private String capacity;
    private String authority;
    private UUID orgUnitId;
    private com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairApprovalStatus approvalStatus;
    private Boolean approvedLevel1;
    private String approverLevel1;
    private LocalDateTime approvedDateLevel1;
    private Boolean approvedLevel2;
    private String approverLevel2;
    private LocalDateTime approvedDateLevel2;
    private String rejectionReason;
    private UUID createdBy;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    private LocalDateTime updatedDate;
    private Boolean isDeleted;
    private List<ShipRepairFacilityAttachmentResponse> attachments;

    private UUID spatialId;
    private GisGeometryType geometryType;
    private String coordinates;
}
