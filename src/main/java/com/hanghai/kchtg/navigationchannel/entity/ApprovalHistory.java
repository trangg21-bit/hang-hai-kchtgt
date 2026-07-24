package com.hanghai.kchtg.navigationchannel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity(name = "NavigationChannelApprovalHistory")
@Table(name = "approval_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "navigation_channel_id", nullable = true)
    private NavigationChannel navigationChannel;

    @Column(name = "approval_level")
    private Integer approvalLevel;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "approved_by", nullable = false, length = 100)
    private String approvedBy;

    @Column(name = "approved_date")
    private LocalDate approvedDate;

    @Column(name = "reason", length = 500)
    private String reason;
}
