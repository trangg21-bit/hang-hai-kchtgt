package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity lưu lịch sử thay đổi của các đài thông tin.
 * Tách biệt khỏi NhaTramHistory để phục vụ module M-015 độc lập.
 */
@Entity
@Table(name = "tai_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaiHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 50)
    private String entityName;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TaiType taiType;

    private UUID entityId;

    @Enumerated(EnumType.STRING)
    private TaiHistoryActionType actionType;

    @Column(length = 2000)
    private String changedField;

    @Column(length = 4000)
    private String previousValue;

    @Column(length = 4000)
    private String newValue;

    private UUID changedBy;
    private Instant changedAt;

    @Column(length = 1000)
    private String reason;
}
