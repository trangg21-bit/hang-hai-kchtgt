package com.hanghai.kchtg.tsql.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity mapping the ts_ql table — Tài sản Quản lý (Management Assets).
 * <p>
 * Stores financial/management data for all KCHTGT assets, mirroring the V1
 * hh.csdl TS_QL structure. Linked to KCHT_CB / KCHT_ATHH via {@code nhom}.
 * </p>
 */
@Entity
@Table(name = "ts_ql")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class TsQl {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** Mã đơn vị quản lý (references org_units). */
    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    /** Nhóm tài sản: CB (Cảng biển), BC (Bến cảng), CC (Cầu cảng), BP (Bến phao),
     *  TTB (Trạm thông tin báo hiệu), CT (Cảng tổng hợp), ND (Khu neo đậu),
     *  CSSCDT (Cơ sở sửa chữa đóng tàu), LHH (Luồng hàng hải),
     *  DBNT (Đèn biển / Nhà trạm), NT (Nhà trạm), PT (Phao tiêu),
     *  VTS (Hệ thống VTS). */
    @Column(name = "nhom", nullable = false, length = 20)
    private String nhom;

    /** Mã tài sản. */
    @Column(name = "ts_ma", length = 50)
    private String tsMa;

    /** Tên tài sản. */
    @Column(name = "ts_ten", nullable = false, length = 500)
    private String tsTen;

    /** Đơn vị tính (Cái, Hệ thống, Quả, m², ...). */
    @Column(name = "don_vi_tinh", length = 100)
    private String donViTinh;

    /** Số lượng. */
    @Column(name = "so_luong", precision = 10, scale = 2)
    private BigDecimal soLuong;

    /** Năm xây dựng. */
    @Column(name = "nam_xay_dung")
    private Integer namXayDung;

    /** Năm đưa vào sử dụng. */
    @Column(name = "nam_su_dung")
    private Integer namSuDung;

    /** Diện tích đất (m²). */
    @Column(name = "dien_tich_dat", precision = 15, scale = 2)
    private BigDecimal dienTichDat;

    /** Diện tích sàn sử dụng (m²). */
    @Column(name = "san_su_dung", precision = 15, scale = 2)
    private BigDecimal sanSuDung;

    /** Nguyên giá (đồng). */
    @Column(name = "nguyen_gia", precision = 20, scale = 4)
    private BigDecimal nguyenGia;

    /** Giá trị còn lại (đồng). */
    @Column(name = "gia_tri_con_lai", precision = 20, scale = 4)
    private BigDecimal giaTriConLai;

    /** Hao mòn lũy kế (đồng). */
    @Column(name = "hao_mon_luy_ke", precision = 20, scale = 4)
    private BigDecimal haoMonLuyKe;

    /** Tình trạng tài sản. */
    @Column(name = "tinh_trang", length = 200)
    private String tinhTrang;

    /** Ghi chú. */
    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;

    /** Ngày kê khai tài sản. Used by F-143 to distinguish lần đầu vs bổ sung. */
    @Column(name = "ngay_ke_khai")
    private LocalDate ngayKeKhai;

    /** Hình thức xử lý tài sản (Sử dụng, Cho thuê, ...). */
    @Column(name = "hinh_thuc_xu_ly", length = 100)
    private String hinhThucXuLy;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
