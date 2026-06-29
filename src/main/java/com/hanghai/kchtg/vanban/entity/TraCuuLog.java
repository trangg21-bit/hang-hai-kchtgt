package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tra cứu log — search/query log for planning records.
 * Used by F-133 Tra cứu quy hoạch.
 */
@Entity
@Table(name = "tra_cuu_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TraCuuLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nguoi_tra_cuu", length = 100)
    private String nguoiTraCuu;

    @Column(name = "tu_khoa", length = 300)
    private String tuKhoa;

    @Column(name = "bo_loc", length = 200)
    private String boLoc;

    @Column(name = "so_luong_ket_qua")
    private Integer soLuongKetQua;

    @Column(name = "ngay_tra_cuu", updatable = false)
    private LocalDateTime ngayTraCuu;

    @PrePersist
    protected void onCreate() {
        this.ngayTraCuu = LocalDateTime.now();
    }
}
