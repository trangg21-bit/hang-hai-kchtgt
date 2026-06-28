package com.hanghai.kchtg.accesslog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Pre-computed daily aggregate statistics for access logs.
 * <p>
 * Populated by {@code LogStatsScheduler} at 03:00 daily.
 * Queried by the "Lanh dao" role (aggregate view only).
 * </p>
 */
@Entity
@Table(name = "log_aggregates", uniqueConstraints = {
        @UniqueConstraint(name = "uk_aggregate_date", columnNames = "date")
})
@Getter
@Setter
@NoArgsConstructor
public class LogAggregate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date", nullable = false, unique = true)
    private LocalDate date;

    @Column(name = "total_accesses", nullable = false)
    private Long totalAccesses = 0L;

    @Column(name = "unique_users", nullable = false)
    private Long uniqueUsers = 0L;

    /** Success rate as a percentage (0.00 – 100.00). */
    @Column(name = "success_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal successRate = BigDecimal.ZERO;

    /** Average request duration in milliseconds. */
    @Column(name = "avg_duration", nullable = false)
    private Integer avgDuration = 0;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;
}
