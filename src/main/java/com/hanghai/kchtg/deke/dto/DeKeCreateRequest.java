package com.hanghai.kchtg.deke.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Create request for DeKe (F-044).
 */
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeKeCreateRequest {

    @jakarta.validation.constraints.NotNull(message = "Loại đê không được để trống")
    private com.hanghai.kchtg.deke.entity.LoaiDe loaiDe;

    @NotBlank(message = "Vị trí không được để trống")
    private String viTri;

    @NotBlank(message = "Tên đê kè không được để trống")
    private String tenDeKe;

    private Double chieuDai;
    private Double caoTrinhDinh;
    private LocalDate thoiDiemDuaVaoKhaiThac;
    private Double chieuCao;
    private String matVatLieu;
    private String tinhTrang;
    private String ghiChu;
    private java.util.UUID donViId;

    private List<DeKeAttachmentCreate> attachments;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeKeAttachmentCreate {
        private String tenTaiLieu;
        private String duongDan;
        private Long kichThuoc;
        private String loaiTaiLieu;
        private String nguoiTaiLen;
    }
}
