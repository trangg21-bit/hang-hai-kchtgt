package com.hanghai.kchtg.shiprepairfacility.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityUpdateRequest {

    @Size(max = 255)
    private String facilityName;

    @Size(max = 500)
    private String address;

    @Size(max = 100)
    private String province;

    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String email;

    private com.hanghai.kchtg.shiprepairfacility.entity.LoaiCoSo facilityType;

    @Size(max = 255)
    private String capacity;

    @Size(max = 255)
    private String authority;
    private java.util.UUID orgUnitId;

    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
}
