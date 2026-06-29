package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tiến độ xử lý sự cố — incident progress tracking.
 * Used by F-131 Quản lý thông tin sự cố.
 */
@Entity
@Table(name = "tien_do_xu_ly")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TienDoXuLy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "su_co_id", nullable = false)
    private SuCo suCo;

    @Column(name = "thoi_gian_cap_nhat")
    private LocalDateTime thoiGianCapNhat;

    @Column(name = "mo_ta_tien_do", columnDefinition = "TEXT")
    private String moTaTienDo;

    @Column(name = "nguoi_cap_nhat", length = 100)
    private String nguoiCapNhat;
}
