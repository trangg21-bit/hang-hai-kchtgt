package com.hanghai.kchtg.gis.line.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "line_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineCategory extends BaseEntity {

    @NotBlank(message = "Ten danh muc khong duoc de trong")
    @Size(max = 100, message = "Ten toi da 100 ky tu")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Ma danh muc khong duoc de trong")
    @Size(max = 50, message = "Ma toi da 50 ky tu")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(length = 500)
    private String description;

    @Column
    @Builder.Default
    private Integer sortOrder = 0;
}
