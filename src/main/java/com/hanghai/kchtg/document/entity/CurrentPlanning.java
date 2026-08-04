package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Quy hoạch hiện hành — current active planning records only.
 * Used by F-133 Tra cứu quy hoạch.
 */
@Entity
@Table(name = "current_planning")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrentPlanning {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ten_do_an", length = 300)
    private String projectName;

    @Column(name = "ngay_phe_duyet")
    private LocalDate approvalDate;

    @Column(name = "pham_vi_ap_dung", columnDefinition = "TEXT")
    private String phamViApDung;

    @Column(name = "ten_file_ban_do", length = 300)
    private String mapFileName;

    @Column(name = "mo_ta_tom_tat", columnDefinition = "TEXT")
    private String moTaTomTat;
}
