package com.hanghai.kchtg.dikerevetment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Create request for DikeRevetment (F-044).
 */
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

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
    private java.util.UUID donViId;

    private List<DikeRevetmentAttachmentCreate> attachments;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DikeRevetmentAttachmentCreate {
        private String fileName;
        private String filePath;
        private Long fileSize;
        private String loaiTaiLieu;
        private String nguoiTaiLen;
    }
}
