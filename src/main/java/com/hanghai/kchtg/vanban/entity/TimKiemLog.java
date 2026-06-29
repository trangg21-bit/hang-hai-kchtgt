package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tìm kiếm log — search activity log.
 * Used by F-135 Tìm kiếm văn bản pháp lý.
 */
@Entity
@Table(name = "tim_kiem_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimKiemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nguoi_tim_kiem", length = 100)
    private String nguoiTimKiem;

    @Column(name = "tu_khoa", length = 300)
    private String tuKhoa;

    @Column(name = "bo_loc", length = 200)
    private String boLoc;

    @Column(name = "so_luong_ket_qua")
    private Integer soLuongKetQua;

    @Column(name = "ngay_tim_kiem", updatable = false)
    private LocalDateTime ngayTimKiem;

    @PrePersist
    protected void onCreate() {
        this.ngayTimKiem = LocalDateTime.now();
    }
}
