package com.hanghai.kchtg.nhatram.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "nha_tram_phao")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@SQLRestriction("deleted_at IS NULL")
public class NhaTramPhao extends BaseNhaTram {
    @Convert(converter = BuoyTypeConverter.class)
    private BuoyType type;

    private String color;
    private String shape;
    private String lightCharacteristic;
    private Double range;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
}
