package com.hanghai.kchtg.interconnect.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "integration_transactions", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class IntegrationTransaction extends BaseEntity {

    @Column(name = "connection_id", nullable = false)
    private UUID connectionId;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "purpose", length = 500)
    private String purpose;

    @Column(name = "organization_unit", length = 255)
    private String organizationUnit;

    @Column(name = "sender", length = 255)
    private String sender;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "receiver_code", length = 100)
    private String receiverCode;

    @Column(name = "sent_content", columnDefinition = "TEXT")
    private String sentContent;

    @Column(name = "received_content", columnDefinition = "TEXT")
    private String receivedContent;
}
