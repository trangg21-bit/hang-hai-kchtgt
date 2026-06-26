package com.hanghai.kchtg.datasharing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Entity representing a shared KCHTGT data record.
 * Tracks what asset type, who it was shared with, format, and approval metadata.
 */
@Entity
@Table(name = "shared_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SharedData extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type")
    private ShareDataType dataType;

    @Enumerated(EnumType.STRING)
    @Column(name = "share_status")
    private ShareStatus shareStatus;

    @Column(name = "shared_with")
    private String sharedWith; // recipient organization

    @Column(name = "shared_at")
    private LocalDate sharedAt;

    @Column(name = "expires_at")
    private LocalDate expiresAt;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "file_format")
    private String fileFormat; // CSV, JSON, XML, PDF

    @Column(name = "record_count")
    private Integer recordCount;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDate approvedAt;

    @CreationTimestamp
    private Instant sharedCreated;

    @UpdateTimestamp
    private Instant sharedUpdated;
}
