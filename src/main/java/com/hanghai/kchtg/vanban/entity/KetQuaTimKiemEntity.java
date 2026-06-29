package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Kết quả tìm kiếm — stored search result snapshots.
 * Used by F-135 Tìm kiếm văn bản pháp lý.
 */
@Entity
@Table(name = "ket_qua_tim_kiem")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KetQuaTimKiemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "van_ban_id")
    private Long vanBanId;

    @Column(name = "ten_van_ban", length = 300)
    private String tenVanBan;

    @Column(name = "so_hieu", length = 100)
    private String soHieu;

    @Column(name = "co_quan_ban_hanh", length = 200)
    private String coQuanBanHanh;

    @Column(name = "ngay_ban_hanh")
    private LocalDate ngayBanHanh;

    @Column(name = "diem_phu_hop", length = 500)
    private String diemPhuHop;

    @Column(name = "mo_ta_tom_tat", columnDefinition = "TEXT")
    private String moTaTomTat;
}
