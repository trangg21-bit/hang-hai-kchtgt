package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "tai_thong_tin_duyen_hai")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TaiThongTinDuyenHai extends BaseTai {
    private BigDecimal frequency;
    private Integer range;
    private String country;
    private String contactInfo;
}
