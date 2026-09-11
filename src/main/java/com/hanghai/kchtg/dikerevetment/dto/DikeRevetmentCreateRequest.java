package com.hanghai.kchtg.dikerevetment.dto;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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

    @NotNull(message = "Loại đê/kè không được để trống")
    private DikeRevetmentType dikeRevetmentType;

    @NotBlank(message = "Vị trí không được để trống")
    private String location;

    private String locationDetail;

    @NotBlank(message = "Tên đê kè không được để trống")
    private String dikeRevetmentName;

    private String code;
    private UUID seaportId;
    private UUID operatingUnitId;

    @Digits(integer = 16, fraction = 4, message = "Chiều dài không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal length;
    @Digits(integer = 16, fraction = 4, message = "Cao trình đỉnh không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal crestElevation;
    private LocalDate commissioningDate;
    @Digits(integer = 16, fraction = 4, message = "Chiều cao không quá 20 chữ số (tối đa 4 số lẻ)")
    private BigDecimal height;
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
