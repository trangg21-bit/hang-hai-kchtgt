package com.hanghai.kchtg.luonghanghai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "luong_hang_hai_attachment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuongHangHaiAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "luong_hang_hai_id", nullable = false)
    private LuongHangHai luongHangHai;

    @Column(name = "ten_tai_lieu", nullable = false, length = 200)
    private String tenTaiLieu;

    @Column(name = "duong_dan", length = 500)
    private String duongDan;

    @Column(name = "kich_thuoc")
    private Long kichThuoc;

    @Column(name = "ngay_tai_len")
    private LocalDate ngayTaiLen;
}
