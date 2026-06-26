package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "tai_lrit")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TaiLRIT extends BaseTai {
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer range;
}
