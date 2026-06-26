package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "tai_cospas_sarsat")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TaiCospasSarsat extends BaseTai {
    private BigDecimal frequency;
    private String protocol;
    private String country;
}
