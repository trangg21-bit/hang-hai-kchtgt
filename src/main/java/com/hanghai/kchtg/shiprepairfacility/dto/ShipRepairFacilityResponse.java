package com.hanghai.kchtg.shiprepairfacility.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityResponse {

    private java.util.UUID id;
    private String facilityName;
    private String address;
    private String province;
    private String phone;
    private String email;
    private com.hanghai.kchtg.shiprepairfacility.entity.LoaiCoSo facilityType;
    private String capacity;
    private String authority;
    private java.util.UUID orgUnitId;
    private com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairApprovalStatus approvalStatus;
    private Boolean approvedLevel1;
    private String approverLevel1;
    private LocalDateTime approvedDateLevel1;
    private Boolean approvedLevel2;
    private String approverLevel2;
    private LocalDateTime approvedDateLevel2;
    private String rejectionReason;
    private String createdBy;
    private LocalDateTime createdDate;
    private String updatedBy;
    private LocalDateTime updatedDate;
    private Boolean isDeleted;
    private List<ShipRepairFacilityAttachmentResponse> attachments;

    private java.util.UUID spatialId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
}
