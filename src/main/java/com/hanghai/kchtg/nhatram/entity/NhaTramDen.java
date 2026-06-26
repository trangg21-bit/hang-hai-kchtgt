package com.hanghai.kchtg.nhatram.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "nha_tram_den")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class NhaTramDen extends BaseNhaTram {
    @Enumerated(EnumType.STRING)
    private BeaconLightType type;

    private Double lightRange;
    private String lightColor;
    private String lightCharacteristic;
    private Double range;
    private LocalDate lastMaintenanceDate;
    private LocalDate nextMaintenanceDate;
}
