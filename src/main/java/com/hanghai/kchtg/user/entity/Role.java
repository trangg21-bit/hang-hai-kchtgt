package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Vai trĂ² (Role) trong he thong â€” dung de nhom permissions va gĂ¡n cho nguoi dung.
 */
@Entity
@Table(name = "app_roles")
@Getter
@Setter
@NoArgsConstructor
public class Role extends BaseEntity {

    /** Ten hien thi cua vai trĂ² (vĂ­ du: "System Administrator", "Manager"). */
    @NotBlank(message = "Ten vai trĂ² khong duoc de trong")
    @Size(max = 100, message = "Ten vai trĂ² toi da 100 ky tu")
    @Column(nullable = false, length = 100)
    private String name;

    /** Ma vai trĂ² duy nhat (vĂ­ du: "ADMIN", "MANAGER", "VIEWER"). */
    @NotBlank(message = "Ma vai trĂ² khong duoc de trong")
    @Size(max = 50, message = "Ma vai trĂ² toi da 50 ky tu")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Mo ta chi tiet ve vai trĂ². */
    @Column(length = 500)
    private String description;

    /** Danh sách các permission keys mà vai trò này sở hữu. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"))
    @Column(name = "permission")
    private List<String> permissions = new ArrayList<>();

    /** Trang tai vai trĂ². */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleStatus status = RoleStatus.ACTIVE;

    /** So luong nguoi dung dang cĂ³ vai trĂ² nay. */
    @Column(nullable = false)
    private int userCount = 0;
}
