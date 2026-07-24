package com.hanghai.kchtg.radarstation.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RadarStationResponse {
    private java.util.UUID id;
    private String stationName;
    private String location;
    private BigDecimal kinhDo;
    private BigDecimal viDo;
    private String stationType;
    private String coverage;
    private BigDecimal emissionArea;
    private String source;
    private String conditionStatus;
    private java.util.UUID orgUnitId;
    private com.hanghai.kchtg.radarstation.entity.RadarStationApprovalStatus approvalStatus;
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
    private List<RadarStationAttachmentResponse> attachments;

    private java.util.UUID khongGianId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;

    private BigDecimal towerHeight;
    private BigDecimal radarRange;

    private java.util.UUID vtsSystemId;
    private String vtsSystemName;
}
