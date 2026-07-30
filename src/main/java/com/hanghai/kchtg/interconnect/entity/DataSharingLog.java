package com.hanghai.kchtg.interconnect.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "data_sharing_logs", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class DataSharingLog extends BaseEntity {

    @Column(name = "transaction_code", nullable = false, length = 100)
    private String transactionCode;

    @Column(name = "account_name", nullable = false, length = 255)
    private String accountName;

    @Column(name = "connection_name", nullable = false, length = 255)
    private String connectionName;

    @Column(name = "sender_system", nullable = false, length = 255)
    private String senderSystem;

    @Column(name = "receiver_system", nullable = false, length = 255)
    private String receiverSystem;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "detail_content", columnDefinition = "TEXT")
    private String detailContent;
}
