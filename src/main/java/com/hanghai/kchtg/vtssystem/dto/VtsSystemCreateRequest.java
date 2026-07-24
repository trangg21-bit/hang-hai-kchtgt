package com.hanghai.kchtg.vtssystem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemCreateRequest {
    @NotBlank(message = "Tên hệ thống không được để trống")
    private String systemName;

    @NotBlank(message = "Vị trí không được để trống")
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
