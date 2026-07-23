package com.hanghai.kchtg.dikerevetment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "dike_revetment_approval_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dike_revetment_id", nullable = false)
    private DikeRevetment dikeRevetment;

    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "approver", nullable = false, length = 100)
    private String approver;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "reason", length = 500)
    private String reason;
}
