package com.hanghai.kchtg.navigationchannel.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * Tọa độ Kinh độ/Vĩ độ (#45) của Luồng hàng hải (F-038).
 * Bảng con độc lập với luồng GIS GisSpatialObject/spatial_id (dùng cho bản đồ KCHT).
 */
@Entity
@Table(name = "navigation_channel_coordinate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
public class NavigationChannelCoordinate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "navigation_channel_id", nullable = false)
    private NavigationChannel navigationChannel;

    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "latitude", precision = 9, scale = 7)
    private BigDecimal latitude;
}
