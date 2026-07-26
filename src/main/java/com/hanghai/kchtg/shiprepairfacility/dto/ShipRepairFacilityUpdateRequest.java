package com.hanghai.kchtg.shiprepairfacility.dto;

import java.util.UUID;

import jakarta.validation.constraints.Size;
import lombok.*;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

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

    private com.hanghai.kchtg.shiprepairfacility.entity.FacilityType facilityType;

    @Size(max = 255)
    private String capacity;

    @Size(max = 255)
    private String authority;
    private UUID orgUnitId;

    private GisGeometryType geometryType;
    private String coordinates;
}
