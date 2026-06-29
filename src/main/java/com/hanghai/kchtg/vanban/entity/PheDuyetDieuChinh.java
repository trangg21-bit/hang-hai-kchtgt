package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Phê duyệt điều chỉnh — approval records for planning adjustments.
 * Used by F-134 Cập nhật quy hoạch bến cảng.
 */
@Entity
@Table(name = "phe_duyet_dieu_chinh")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetDieuChinh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dieu_chinh_id", nullable = false)
    private DieuChinhQuyHoach dieuChinh;

    @Column(name = "cap_phe_duyet", length = 100)
    private String capPheDuyet;

    @Column(name = "trang_thai", length = 50)
    private String trangThai;

    @Column(name = "nguoi_phe_duyet", length = 100)
    private String nguoiPheDuyet;

    @Column(name = "ngay_phe_duyet")
    private LocalDate ngayPheDuyet;

    @Column(name = "ghi_chu", length = 500)
    private String ghiChu;
}
