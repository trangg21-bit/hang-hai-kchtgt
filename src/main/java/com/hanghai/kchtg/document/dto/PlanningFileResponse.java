package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanningFileResponse {

    private UUID id;
    private UUID portPlanningId;
    private String fileName;
    private String fileType;
    private String filePath;
    private Long fileSize;
    private LocalDateTime uploadedAt;
    private String uploadedBy;
}
