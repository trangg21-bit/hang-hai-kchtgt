package com.hanghai.kchtg.assetmovement.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity tài sản kiểm kê trong kế hoạch kiểm kê (F-125).
 */
@Entity
@Table(name = "inventory_assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
public class InventoryAsset extends BaseEntity {

    private UUID planId;
    private UUID assetId;

    @Column(precision = 15, scale = 2)
    private BigDecimal bookValue;

    @Column(precision = 15, scale = 2)
    private BigDecimal actualValue;

    @Column(precision = 15, scale = 2)
    private BigDecimal difference;

    @Column(length = 50)
    private InventoryStatus inventoryStatus;

    @Column(length = 1000)
    private String notes;

    @Version
    private Integer lockVersion;

}
