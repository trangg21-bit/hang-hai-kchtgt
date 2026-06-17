package com.hanghai.kchtg.group.entity;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Nhóm người dùng (User Group) — dùng để gom quyền và phân quyền theo nhóm.
 */
@Entity
@Table(name = "user_groups")
@Getter
@Setter
@NoArgsConstructor
public class UserGroup extends BaseEntity {

    /** Tên hiển thị của nhóm (bắt buộc). */
    @Column(nullable = false, length = 150)
    private String name;

    /** Mã định danh duy nhất của nhóm (bắt buộc, unique). */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Mô tả chi tiết về nhóm. */
    @Column(length = 500)
    private String description;

    /** Danh sách mã quyền (permission keys) mà nhóm này sở hữu. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "user_group_permissions",
            joinColumns = @JoinColumn(name = "user_group_id")
    )
    @Column(name = "permission", nullable = false)
    private List<String> permissions = new ArrayList<>();

    /** Trạng thái: ACTIVE (hoạt động) hoặc INACTIVE (vô hiệu). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private GroupStatus status = GroupStatus.ACTIVE;
}
