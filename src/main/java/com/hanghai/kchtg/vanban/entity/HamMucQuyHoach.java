package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Hàm mục quy hoạch — planning target metrics.
 * Used by F-132 Quản lý quy hoạch bến cảng.
 */
@Entity
@Table(name = "ham_muc_quy_hoach")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HamMucQuyHoach {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quy_hoach_id", nullable = false)
    private QuyHoachBenCang quyHoach;

    @Column(name = "ten_ham_muc", nullable = false, length = 200)
    private String tenHamMuc;

    @Column(name = "don_vi_tinh", length = 50)
    private String donViTinh;

    @Column(name = "gia_tri_ke_hoach", precision = 15, scale = 2)
    private BigDecimal giaTriKeHoach;

    @Column(name = "gia_tri_thuc_te", precision = 15, scale = 2)
    private BigDecimal giaTriThucTe;

    @Column(name = "trang_thai", length = 50)
    private String trangThai;
}
