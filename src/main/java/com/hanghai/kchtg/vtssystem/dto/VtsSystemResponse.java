package com.hanghai.kchtg.vtssystem.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemResponse {
    private java.util.UUID id;
    private String systemName;
    private String location;
    private String conditionStatus;
    private String responsibilityLevel;
    private String source;
    private String partner;
    private java.util.UUID orgUnitId;
    private String scope;
    private String approvalStatus;
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
    private List<VtsSystemAttachmentResponse> attachments;

    private java.util.UUID khongGianId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
}
