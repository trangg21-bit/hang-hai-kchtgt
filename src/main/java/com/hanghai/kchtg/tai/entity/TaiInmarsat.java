package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.math.BigDecimal;

@Entity
@Table(name = "tai_inmarsat")
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TaiInmarsat extends BaseTai {
    private String satelliteId;
    private BigDecimal signalStrength;
    private String serviceType;
}
