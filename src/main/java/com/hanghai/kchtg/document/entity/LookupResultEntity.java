package com.hanghai.kchtg.document.entity;

import java.util.UUID;

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
@Table(name = "lookup_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LookupResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "quy_hoach_id")
    private java.util.UUID planningId;

    @Column(name = "ten_do_an", length = 300)
    private String projectName;

    @Column(name = "coquan_phe_duyet", length = 200)
    private String approvalAuthority;

    @Column(name = "ngay_phe_duyet")
    private LocalDate approvalDate;

    @Column(name = "pham_vi_ap_dung", columnDefinition = "TEXT")
    private String applicationScope;

    @Column(name = "tinh_trang", length = 50)
    private String status;
}
