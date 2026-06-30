package com.hanghai.kchtg.deke.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "de_ke_attachment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeKeAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "de_ke_id", nullable = false)
    private DeKe deKe;

    @Column(name = "ten_tai_lieu", nullable = false, length = 200)
    private String tenTaiLieu;

    @Column(name = "duong_dan", length = 500)
    private String duongDan;

    @Column(name = "kich_thuoc")
    private Long kichThuoc;

    @Column(name = "loai_tai_lieu", length = 100)
    private String loaiTaiLieu;

    @Column(name = "nguoi_tai_len", length = 100)
    private String nguoiTaiLen;

    @Column(name = "ngay_tai_len")
    private LocalDate ngayTaiLen;
}
