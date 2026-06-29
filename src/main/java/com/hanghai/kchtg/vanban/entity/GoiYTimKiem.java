package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Gợi ý tìm kiếm — search suggestion records.
 * Used by F-135 Tìm kiếm văn bản pháp lý.
 */
@Entity
@Table(name = "goi_y_tim_kiem")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoiYTimKiem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tu_khoa", length = 200, unique = true)
    private String tuKhoa;

    @Column(name = "so_luong_tim")
    private Integer soLuongTim;

    @Column(name = "lan_cuoi_tim")
    private LocalDateTime lanCuoiTim;
}
