package com.hanghai.kchtg.cangben.dto.cangbien;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request DTO for creating a new CangBien (port).
 * GPS fields (viDo/kinhDo) must be both present or both absent.
 */
@Data
public class CreateCangBienRequest {

    @NotBlank(message = "Mã cảng không được để trống")
    @Size(max = 50, message = "Mã cảng tối đa 50 ký tự")
    private String maCang;

    @NotBlank(message = "Tên cảng không được để trống")
    @Size(max = 255, message = "Tên cảng tối đa 255 ký tự")
    private String tenCang;

    @Size(max = 100, message = "Tỉnh/thành phố tối đa 100 ký tự")
    private String tinhThanhPho;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal viDo;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal kinhDo;

    @DecimalMin(value = "0", inclusive = false, message = "Diện tích phải lớn hơn 0")
    private BigDecimal dienTich;

    private BigDecimal khaNangTiepNhan;

    private com.hanghai.kchtg.common.entity.TrangThaiHoatDong trangThaiHoatDong;

    private java.util.UUID orgUnitId;

    private Integer nhomCangBien;
    private java.util.UUID bieuTuongId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;

    // ── Extended fields (V53) ────────────────────────────────────────

    @Size(max = 500, message = "Địa điểm chi tiết tối đa 500 ký tự")
    private String diaDiemChiTiet;

    private Integer phanCap;

    private Integer heQuyChieu;

    private Integer quyTacHienThi;

    // ── zobjDataSub fields ───────────────────────────────────────────

    @Size(max = 2000, message = "Phạm vi vùng nước tối đa 2000 ký tự")
    private String phamViVungNuoc;

    private Integer tongSoBenCang;

    private Integer tongSoKhuNeoDauChuyenTai;

    private Integer tongSoTuyenLuongCongCong;

    private Integer tongSoTuyenLuongChuyenDung;

    @DecimalMin(value = "0", message = "Tổng chiều dài luồng công cộng phải >= 0")
    private BigDecimal tongChieuDaiLuongCongCong;

    @DecimalMin(value = "0", message = "Tổng chiều dài luồng chuyên dùng phải >= 0")
    private BigDecimal tongChieuDaiLuongChuyenDung;

    private Integer tongSoPhaoTieuBaoHieu;

    private Integer tongSoDeKe;

    @DecimalMin(value = "0", message = "Tổng chiều dài đê kè phải >= 0")
    private BigDecimal tongChieuDaiDeKe;

    private Integer tongSoDenBienDangTieu;

    private Integer soLuongBenPhao;

    private Integer soLuongKhuNeoDau;

    private Integer soLuongKhuChuyenTai;

    @Size(max = 2000, message = "Các khu nước khác tối đa 2000 ký tự")
    private String cacKhuNuocKhac;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String ghiChu;

    @AssertTrue(message = "Vĩ độ và kinh độ phải được điền đồng thời")
    public boolean isGpsPaired() {
        return (viDo == null && kinhDo == null) || (viDo != null && kinhDo != null);
    }
}
