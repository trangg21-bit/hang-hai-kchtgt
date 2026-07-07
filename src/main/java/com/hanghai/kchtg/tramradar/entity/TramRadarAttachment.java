package com.hanghai.kchtg.tramradar.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tram_radar_attachment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TramRadarAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tram_radar_id", nullable = false)
    private Long tramRadarId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tram_radar_id", insertable = false, updatable = false)
    private TramRadar tramRadar;

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
