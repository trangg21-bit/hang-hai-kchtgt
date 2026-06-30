package com.hanghai.kchtg.cosuachua.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "co_sua_chua_dong_tau")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoSuaChuaDongTau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_co_so", nullable = false, length = 255)
    private String tenCoSo;

    @Column(name = "dia_chi", nullable = false, length = 500)
    private String diaChi;

    @Column(name = "tinh_thanh", nullable = false, length = 100)
    private String tinhThanh;

    @Column(name = "so_dien_thoai", length = 20)
    private String soDienThoai;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "loai_co_so", nullable = false, length = 100)
    private String loaiCoSo;

    @Column(name = "kha_nang", length = 255)
    private String khaNang;

    @Column(name = "chu_quan", length = 255)
    private String chuQuan;

    @Column(name = "trang_thai", nullable = false, length = 30)
    private String trangThai;

    @Column(name = "phe_duyet_c1", nullable = false)
    @Builder.Default
    private Boolean pheDuyetC1 = false;

    @Column(name = "nguoi_phe_duyet_c1", length = 100)
    private String nguoiPheDuyetC1;

    @Column(name = "ngay_phe_duyet_c1")
    private LocalDateTime ngayPheDuyetC1;

    @Column(name = "phe_duyet_c2", nullable = false)
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

    @CreatedDate
    @Column(name = "ngay_tao", nullable = false, updatable = false)
    private LocalDateTime ngayTao;

    @LastModifiedDate
    @Column(name = "ngay_sua_doi")
    private LocalDateTime ngaySuaDoi;

    @Column(name = "nguoi_sua_doi", length = 100)
    private String nguoiSuaDoi;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @OneToMany(mappedBy = "coSuaChuaDongTau", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<CoSuaChuaDongTauAttachment> attachments = new java.util.ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.trangThai == null) {
            this.trangThai = "PROPOSED";
        }
        if (this.pheDuyetC1 == null) {
            this.pheDuyetC1 = false;
        }
        if (this.pheDuyetC2 == null) {
            this.pheDuyetC2 = false;
        }
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
    }
}
