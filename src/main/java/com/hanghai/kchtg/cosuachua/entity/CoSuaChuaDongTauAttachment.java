package com.hanghai.kchtg.cosuachua.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "co_sua_chua_dong_tau_attachment")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoSuaChuaDongTauAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "co_sua_chua_id", nullable = false)
    private CoSuaChuaDongTau coSuaChuaDongTau;

    @Column(name = "ten_tai_lieu", nullable = false, length = 255)
    private String tenTaiLieu;

    @Column(name = "duong_dan", nullable = false, length = 500)
    private String duongDan;

    @Column(name = "kich_thuoc")
    private Long kichThuoc;

    @Column(name = "loai_tai_lieu", length = 50)
    private String loaiTaiLieu;

    @Column(name = "nguoi_tai_len", length = 100)
    private String nguoiTaiLen;

    @CreatedDate
    @Column(name = "ngay_tai_len")
    private LocalDateTime ngayTaiLen;
}
