package com.hanghai.kchtg.report.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Cargo transaction entity for F-104: Báo cáo hàng hóa XNK.
 * Records import/export cargo transactions at ports.
 */
@Entity
@Table(name = "cargo_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CargoTransaction extends BaseEntity {

    public enum TransactionType {
        EXPORT,
        IMPORT
    }

    @Column(name = "port_code", nullable = false, length = 50)
    private String portCode;

    @Column(name = "cargo_type", nullable = false, length = 100)
    private String cargoType;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 10)
    private TransactionType transactionType;

    @Column(name = "quantity")
    private Long quantity;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;
}
