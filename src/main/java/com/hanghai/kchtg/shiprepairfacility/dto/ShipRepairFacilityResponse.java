package com.hanghai.kchtg.shiprepairfacility.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.shiprepairfacility.entity.FacilityType;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityResponse {

    private UUID id;
    private String facilityName;
    private String address;
    private Integer provinceId;
    private String phone;
    private String email;
    private FacilityType facilityType;
    private String capacity;
    private String authority;
    private UUID orgUnitId;
    private ShipRepairApprovalStatus approvalStatus;
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
