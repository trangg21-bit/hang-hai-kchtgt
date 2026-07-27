package com.hanghai.kchtg.document.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanningFileCreateRequest {

    @NotNull(message = "portPlanningId không được để trống")
    private java.util.UUID portPlanningId;

    @NotNull(message = "fileName không được để trống")
    private String fileName;

    private String fileType;

    @NotNull(message = "filePath không được để trống")
    private String filePath;

    private Long fileSize;
    private String uploadedBy;
}
