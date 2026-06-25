package com.hanghai.kchtg.gis.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "enc_cells")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartCell extends BaseEntity {

    public enum Status {
        ACTIVE,
        INACTIVE
    }

    @NotBlank(message = "Tên cell không được để trống")
    @Size(max = 100, message = "Tên cell tối đa 100 ký tự")
    @Column(name = "cell_name", nullable = false, unique = true, length = 100)
    private String cellName;

    @Size(max = 100, message = "Tên nhà sản xuất tối đa 100 ký tự")
    @Column(length = 100)
    private String producer;

    @Column
    private Integer edition;

    @Column
    private Integer scale;

    @Column(name = "update_number")
    private Integer updateNumber;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "is_encrypted", nullable = false)
    @Builder.Default
    private Boolean isEncrypted = false;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ACTIVE;
}
