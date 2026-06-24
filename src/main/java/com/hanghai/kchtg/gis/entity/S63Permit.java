package com.hanghai.kchtg.gis.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "s63_permits")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class S63Permit extends BaseEntity {

    @NotBlank(message = "Tên cell không được để trống")
    @Size(max = 100, message = "Tên cell tối đa 100 ký tự")
    @Column(name = "cell_name", nullable = false, unique = true, length = 100)
    private String cellName;

    @NotBlank(message = "Khóa permit không được để trống")
    @Size(max = 200, message = "Khóa permit tối đa 200 ký tự")
    @Column(name = "permit_key", nullable = false, length = 200)
    private String permitKey;

    @NotNull(message = "Ngày hết hạn không được để trống")
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
