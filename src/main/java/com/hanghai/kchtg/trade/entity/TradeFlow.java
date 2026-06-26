package com.hanghai.kchtg.trade.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Trade flow entity — records commercial cargo exchange between ports.
 * Used by F-105 Biểu đồ trao đổi thương mại.
 */
@Entity
@Table(name = "trade_flows")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeFlow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cảng nguồn */
    @Column(name = "source_port", nullable = false, length = 100)
    private String sourcePort;

    /** Cảng đích */
    @Column(name = "dest_port", nullable = false, length = 100)
    private String destPort;

    /** Loại hàng hóa */
    @Column(name = "cargo_type", nullable = false, length = 50)
    private String cargoType;

    /** Khối lượng ( tấn ) */
    @Column(name = "quantity", nullable = false, precision = 15, scale = 2)
    private BigDecimal quantity;

    /** Tháng/Năm (vd: "06/2026") */
    @Column(name = "period", nullable = false, length = 20)
    private String period;

    @Column(name = "created_at", updatable = false)
    private LocalDate createdAt;
}
