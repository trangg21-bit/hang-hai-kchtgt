package com.hanghai.kchtg.shiprepairfacility.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.shiprepairfacility.entity.FacilityType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityUpdateRequest {

    @Size(max = 255)
    private String facilityName;

    @Size(max = 500)
    private String address;

    private Integer provinceId;

    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String email;

    private FacilityType facilityType;

    @Size(max = 255)
    private String capacity;

    @Size(max = 255)
    private String authority;
    private UUID orgUnitId;

    private GisGeometryType geometryType;
    private String coordinates;
}
