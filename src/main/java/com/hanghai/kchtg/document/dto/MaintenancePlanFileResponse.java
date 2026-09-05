package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for MaintenancePlanFile (file kế hoạch / file xác nhận).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePlanFileResponse {

    private UUID id;
    private String fileCategory;
    private String fileType;
    private String fileName;
    private String filePath;
    private UUID uploadedBy;
    private LocalDateTime uploadedAt;
}
