package com.hanghai.kchtg.common.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.util.UUID;

/**
 * Danh mục Đơn vị khai thác (DM_DON_VI_KHAI_THAC) — cấu trúc giống operating_organizations
 * (Đơn vị vận hành), dùng riêng cho trường "Đơn vị khai thác" của Bến phao.
 */
@Entity
@Table(name = "operating_units")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
public class OperatingUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "parent_code", length = 50)
    private String parentCode;

    @Column(name = "name", nullable = false, length = 255)
    private String name;
}
