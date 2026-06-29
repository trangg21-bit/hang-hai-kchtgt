package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Quy hoạch hiện hành — current active planning records only.
 * Used by F-133 Tra cứu quy hoạch.
 */
@Entity
@Table(name = "quy_hoach_hien_hanh")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuyHoachHienHanh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_do_an", length = 300)
    private String tenDoAn;

    @Column(name = "ngay_phe_duyet")
    private LocalDate ngayPheDuyet;

    @Column(name = "pham_vi_ap_dung", columnDefinition = "TEXT")
    private String phamViApDung;

    @Column(name = "ten_file_ban_do", length = 300)
    private String tenFileBanDo;

    @Column(name = "mo_ta_tom_tat", columnDefinition = "TEXT")
    private String moTaTomTat;
}
