package com.hanghai.kchtg.shiprepairfacility.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.shiprepairfacility.entity.FacilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class ShipRepairFacilityCreateRequest {

    private RecordSecurityLevel securityLevel;

    @NotBlank(message = "facilityName is required")
    @Size(max = 255)
    private String facilityName;

    @NotBlank(message = "address is required")
    @Size(max = 500)
    private String address;

    @NotNull(message = "provinceId is required")
    private Integer provinceId;

    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String email;

    @jakarta.validation.constraints.NotNull(message = "facilityType is required")
    private FacilityType facilityType;

    @Size(max = 255)
    private String capacity;

    @Size(max = 255)
    private String authority;
    private UUID orgUnitId;

    private GisGeometryType geometryType;
    private String coordinates;
}
