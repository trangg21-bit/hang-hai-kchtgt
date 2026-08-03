package com.hanghai.kchtg.mapicon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

/**
 * Entity represent a Map Symbol (Ký hiệu bản đồ) saved in Database.
 */
@Entity
@Table(name = "map_symbols")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapSymbol extends BaseEntity {

    @NotBlank(message = "Tên biểu tượng không được để trống")
    @Size(max = 255, message = "Tên biểu tượng tối đa 255 ký tự")
    @Column(nullable = false, length = 255)
    private String name;

    @Size(max = 500)
    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "Hình ảnh không được để trống")
    @Column(name = "image", columnDefinition = "TEXT", nullable = false)
    private String image;

    @Column(nullable = false)
    private MapSymbolStatus status;

    @Column(name = "created_by", length = 50)
    private UUID createdBy;
}
