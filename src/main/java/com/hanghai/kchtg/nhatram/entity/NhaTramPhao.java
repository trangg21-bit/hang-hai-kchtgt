package com.hanghai.kchtg.nhatram.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDate;

@Entity
@Table(name = "nha_tram_phao")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class NhaTramPhao extends BaseNhaTram {
    @Enumerated(EnumType.STRING)
    private BuoyType type;
    
    private String color;
    private String shape;
    private String lightCharacteristic;
    private Double range;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
}
