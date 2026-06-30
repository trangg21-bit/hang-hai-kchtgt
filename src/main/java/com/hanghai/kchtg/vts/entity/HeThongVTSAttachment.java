package com.hanghai.kchtg.vts.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "he_thong_vts_attachment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeThongVTSAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "he_thong_vts_id", nullable = false)
    private Long heThongVTSId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "he_thong_vts_id", insertable = false, updatable = false)
    private HeThongVTS heThongVTS;

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

    @Column(name = "ngay_tai_len")
    private LocalDateTime ngayTaiLen;
}
