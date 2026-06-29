package com.hanghai.kchtg.vanban.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Kết quả tra cứu — read projection of approved planning records.
 * Used by F-133 Tra cứu quy hoạch.
 */
@Entity
@Table(name = "ket_qua_tra_cuu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KetQuaTraCuuEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quy_hoach_id")
    private Long quyHoachId;

    @Column(name = "ten_do_an", length = 300)
    private String tenDoAn;

    @Column(name = "coquan_phe_duyet", length = 200)
    private String coQuanPheDuyet;

    @Column(name = "ngay_phe_duyet")
    private LocalDate ngayPheDuyet;

    @Column(name = "pham_vi_ap_dung", columnDefinition = "TEXT")
    private String phamViApDung;

    @Column(name = "tinh_trang", length = 50)
    private String tinhTrang;
}
