package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Tài liệu đính kèm văn bản pháp lý.
 * Used by F-128 Quản lý văn bản pháp lý.
 */
@Entity
@Table(name = "tai_lieu_dinh_kem")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiLieuDinhKem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "van_ban_id", nullable = false)
    private VanBanPhapLy vanBan;

    @Column(name = "ten_tai_lieu", nullable = false, length = 200)
    private String tenTaiLieu;

    @Column(name = "duong_dan", length = 500)
    private String duongDan;

    @Column(name = "kich_thuoc")
    private Long kichThuoc;

    @Column(name = "ngay_tai_len")
    private LocalDate ngayTaiLen;
}
