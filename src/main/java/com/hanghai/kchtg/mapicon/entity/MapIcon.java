package com.hanghai.kchtg.mapicon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "map_icons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapIcon extends BaseEntity {

    public enum Category {
        BUOY,
        LIGHTHOUSE,
        BEACON,
        WHARF,
        OTHER
    }

    public enum Status {
        ACTIVE,
        INACTIVE
    }

    @NotBlank(message = "Ten icon khong duoc de trong")
    @Size(max = 100, message = "Ten icon toi da 100 ky tu")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Ma icon khong duoc de trong")
    @Size(max = 50, message = "Ma icon toi da 50 ky tu")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(length = 50)
    private String size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Status status = Status.ACTIVE;
}
