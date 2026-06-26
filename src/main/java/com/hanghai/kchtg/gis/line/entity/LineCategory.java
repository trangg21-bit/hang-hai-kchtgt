package com.hanghai.kchtg.gis.line.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "line_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineCategory extends BaseEntity {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên tối đa 100 ký tự")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Mã danh mục không được để trống")
    @Size(max = 50, message = "Mã tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(length = 500)
    private String description;

    @Column
    @Builder.Default
    private Integer sortOrder = 0;
}
