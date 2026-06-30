package com.hanghai.kchtg.mapicon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

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

    @NotBlank(message = "Mã ký hiệu không được để trống")
    @Size(max = 50, message = "Mã ký hiệu tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank(message = "Tên ký hiệu không được để trống")
    @Size(max = 100, message = "Tên ký hiệu tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "Nhóm ký hiệu không được để trống")
    @Column(nullable = false, length = 50)
    private String category;

    @NotBlank(message = "Icon không được để trống")
    @Column(nullable = false, length = 50)
    private String icon;

    @Column(length = 20)
    private String color;

    @Column(name = "symbol_value", length = 50)
    private String value;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_by", length = 50)
    private String createdBy;
}
