package com.hanghai.kchtg.vtssystem.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemUpdateRequest {
    private String systemName;
    private String location;
    private String conditionStatus;
    private String responsibilityLevel;
    private String source;
    private String partner;
    private java.util.UUID orgUnitId;
    private String scope;

    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
}
