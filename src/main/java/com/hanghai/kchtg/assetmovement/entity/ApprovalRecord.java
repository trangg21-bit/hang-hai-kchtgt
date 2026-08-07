package com.hanghai.kchtg.assetmovement.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity lưu phê duyệt trong quy trình biến động (F-127).
 */
@Entity
@Table(name = "approval_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class ApprovalRecord extends BaseEntity {

    private UUID requestId;

    @Enumerated(EnumType.ORDINAL)
    private ApprovalLevel approvalLevel;

    private UUID approverName;

    @Column(length = 50)
    private ApprovalResult result;

    @Column(length = 2000)
    private String reason;

    private Instant approvalDate;

    @Column(length = 1000)
    private String description;

    @Version
    private Integer lockVersion;
}
