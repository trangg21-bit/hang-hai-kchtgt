package com.hanghai.kchtg.datasharing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

/**
 * Audit trail entity for share/unshare actions on shared data records.
 */
@Entity
@Table(name = "share_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shared_data_id")
    private Long sharedDataId;

    @Column(name = "action")
    private String action; // SHARE, REVOKE, EXPIRE

    @Column(name = "actor")
    private String actor;

    @Column(name = "recipient")
    private String recipient;

    @Column(name = "comments", length = 1000)
    private String comments;

    @CreationTimestamp
    private Instant createdAt;
}
