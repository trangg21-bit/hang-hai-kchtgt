package com.hanghai.kchtg.dikerevetment.dto;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Create request for DikeRevetment (F-044).
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentCreateRequest {

    @jakarta.validation.constraints.NotNull(message = "Loại đê không được để trống")
    private DikeRevetmentType dikeRevetmentType;

    @NotBlank(message = "Vị trí không được để trống")
    private String location;

    @NotBlank(message = "Tên đê kè không được để trống")
    private String dikeRevetmentName;

    private Double length;
    private Double crestElevation;
    private LocalDate commissioningDate;
    private Double height;
    private String surfaceMaterial;
    private String status;
    private String note;
    private UUID orgUnitId;

    private List<DikeRevetmentAttachmentCreate> attachments;
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID symbolId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DikeRevetmentAttachmentCreate {
        private String fileName;
        private String filePath;
        private Long fileSize;
        private String documentType;
        private String uploadedBy;
    }
}
