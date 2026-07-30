package com.hanghai.kchtg.port.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity storing GPS coordinate points for a port (Cảng biển).
 * Each port can have multiple coordinate points ordered by sort_order.
 * <p>
 * Uses its own BIGINT auto-increment PK (not BaseEntity) because this is
 * a lightweight child table managed entirely through the parent's cascade.
 * </p>
 */
@Entity
@Table(name = "port_coordinates")
@Getter
@Setter
@NoArgsConstructor
public class PortCoordinate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id", nullable = false)
    @JsonIgnore
    private Port port;

    @Column(name = "latitude", nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }
}
