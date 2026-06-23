package com.hanghai.kchtg.integration.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Details of assets currently undergoing review or maintenance (non-published status).
 */
@Data
@Builder
public class MaintenanceInfoDto {

    private String code;
    private String name;
    private String assetType; // POINT, LINE, POLYGON
    private String objectSubtype; // PORT, BUOY, etc.
    private String description;
    private String status;
    private LocalDateTime lastUpdated;
}
