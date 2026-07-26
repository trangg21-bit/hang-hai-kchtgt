package com.hanghai.kchtg.shiprepairfacility.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipRepairFacilityCreateRequest {

    @NotBlank(message = "facilityName is required")
    @Size(max = 255)
    private String facilityName;

    @NotBlank(message = "address is required")
    @Size(max = 500)
    private String address;

    @NotBlank(message = "province is required")
    @Size(max = 100)
    private String province;

    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String email;

    @jakarta.validation.constraints.NotNull(message = "facilityType is required")
    private com.hanghai.kchtg.shiprepairfacility.entity.FacilityType facilityType;

    @Size(max = 255)
    private String capacity;

    @Size(max = 255)
    private String authority;
    private UUID orgUnitId;

    private GisGeometryType geometryType;
    private String coordinates;
}
