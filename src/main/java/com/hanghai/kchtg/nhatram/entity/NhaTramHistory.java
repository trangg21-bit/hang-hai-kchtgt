package com.hanghai.kchtg.nhatram.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "nha_tram_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class NhaTramHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Enumerated(EnumType.STRING)
    private NhaTramType tramType;
    
    private UUID entityId;
    
    @Enumerated(EnumType.STRING)
    private NhaTramHistoryActionType actionType;
    
    private String changedField;
    
    @Column(length = 4000)
    private String previousValue;
    
    @Column(length = 4000)
    private String newValue;
    
    private Long changedBy;
    private LocalDateTime changedAt;
    
    @Column(length = 1000)
    private String reason;
    
    @Column(length = 4000)
    private String diffData;
}
