package com.hanghai.kchtg.datasharing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "share_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "shared_data_id")
    private java.util.UUID sharedDataId;

    @Column(name = "action")
    private String action; // SHARE, REVOKE, EXPIRE

    @Column(name = "actor")
    private java.util.UUID actor;

    @Column(name = "recipient")
    private String recipient;

    @Column(name = "comments", length = 1000)
    private String comments;

    @CreationTimestamp
    private Instant createdAt;
}
