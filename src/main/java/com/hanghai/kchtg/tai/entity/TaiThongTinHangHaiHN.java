package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.math.BigDecimal;

@Entity
@Table(name = "tai_thong_tin_hang_hai_hn")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TaiThongTinHangHaiHN extends BaseTai {
    private BigDecimal frequency;
    private Integer range;
    private String department;
}
