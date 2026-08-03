package com.hanghai.kchtg.port.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing an infrastructure item (công trình KCHT) under a port (Cảng biển).
 * Corresponds to table: port_infrastructure.
 * <p>
 * Uses its own BIGINT auto-increment PK (not BaseEntity) because this is
 * a lightweight child table managed entirely through the parent's cascade.
 * </p>
 */
@Entity
@Table(name = "port_infrastructures")
@Getter
@Setter
@NoArgsConstructor
public class PortInfrastructure {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id", nullable = false)
    @JsonIgnore
    private Port port;

    @Column(name = "sequence_number", nullable = false)
    private Integer stt;

    @Column(name = "infrastructure_name", nullable = false, length = 255)
    private String infraName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

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
