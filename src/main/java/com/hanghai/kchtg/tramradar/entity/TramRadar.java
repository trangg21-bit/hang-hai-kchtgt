package com.hanghai.kchtg.tramradar.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tram_radar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("is_deleted = false")
public class TramRadar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_tram", nullable = false, length = 255)
    private String tenTram;

    @Column(name = "vi_tri", nullable = false, length = 500)
    private String viTri;

    @Column(name = "kinh_do", precision = 10, scale = 6)
    private BigDecimal kinhDo;

    @Column(name = "vi_do", precision = 10, scale = 6)
    private BigDecimal viDo;

    @Column(name = "loai_tram", length = 100)
    private String loaiTram;

    @Column(name = "co_trinh", length = 100)
    private String coTrinh;

    @Column(name = "dien_tich_pha_xa", precision = 10, scale = 2)
    private BigDecimal dienTichPhaXa;

    @Column(name = "nguon_goc", length = 255)
    private String nguonGoc;

    @Column(name = "tinh_trang", length = 50)
    private String tinhTrang;

    @Column(name = "trang_thai", nullable = false, length = 20)
    private String trangThai;

    @Column(name = "phe_duyet_c1")
    @Builder.Default
    private Boolean pheDuyetC1 = false;

    @Column(name = "nguoi_phe_duyet_c1", length = 100)
    private String nguoiPheDuyetC1;

    @Column(name = "ngay_phe_duyet_c1")
    private LocalDateTime ngayPheDuyetC1;

    @Column(name = "phe_duyet_c2")
    @Builder.Default
    private Boolean pheDuyetC2 = false;

    @Column(name = "nguoi_phe_duyet_c2", length = 100)
    private String nguoiPheDuyetC2;

    @Column(name = "ngay_phe_duyet_c2")
    private LocalDateTime ngayPheDuyetC2;

    @Column(name = "ly_do_tu_choi", length = 500)
    private String lyDoTuChoi;

    @Column(name = "nguoi_tao", nullable = false, length = 100)
    private String nguoiTao;

    @Column(name = "ngay_tao", nullable = false)
    private LocalDateTime ngayTao;

    @Column(name = "nguoi_sua_doi", length = 100)
    private String nguoiSuaDoi;

    @Column(name = "ngay_sua_doi")
    private LocalDateTime ngaySuaDoi;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @OneToMany(mappedBy = "tramRadar", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TramRadarAttachment> attachments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (trangThai == null) trangThai = "PROPOSED";
        if (ngayTao == null) ngayTao = LocalDateTime.now();
        if (pheDuyetC1 == null) pheDuyetC1 = false;
        if (pheDuyetC2 == null) pheDuyetC2 = false;
        if (isDeleted == null) isDeleted = false;
    }

    @PreUpdate
    protected void onUpdate() {
        ngaySuaDoi = LocalDateTime.now();
    }
}
