package com.hanghai.kchtg.interconnect.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.interconnect.enums.ConnectionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "integration_connections", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class IntegrationConnection extends BaseEntity {

    @Column(name = "account_name", nullable = false, length = 255)
    private String accountName;

    @Column(name = "connection_name", nullable = false, length = 255)
    private String connectionName;

    @Column(name = "sender_system", nullable = false, length = 255)
    private String senderSystem;

    @Column(name = "receiver_system", nullable = false, length = 255)
    private String receiverSystem;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ConnectionStatus status;

    @Column(name = "password", columnDefinition = "TEXT")
    private String password;
}
