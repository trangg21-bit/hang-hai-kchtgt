package com.hanghai.kchtg.group.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Quan he giua nguoi dung va nhom - cho phép mot nguoi dung thuoc nhieu nhom
 * và mot nhom có nhieu nguoi dung (Many-to-Many thong qua entity join).
 */
@Entity
@Table(name = "group_members")
@Getter
@Setter
@NoArgsConstructor
public class GroupMember extends BaseEntity {

    /** Nguoi dung trong nhom. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Nhom ma nguoi dung thuoc ve. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_group_id", nullable = false)
    private UserGroup userGroup;

    /** Vai trò trong nhom (ví du: "owner", "admin", "member", "viewer"). */
    @Column(nullable = false, columnDefinition = "SMALLINT DEFAULT 2")
    private GroupMemberRole role = GroupMemberRole.MEMBER;

    /** Trang tai thanh vien (active hoăc removed). */
    @Enumerated(EnumType.ORDINAL)
    @Column(nullable = false)
    private GroupMemberStatus status = GroupMemberStatus.ACTIVE;

    /** Thoi diem nguoi dung duoc thêm vào nhom. */
    @Column(name = "joined_at")
    private java.time.LocalDateTime joinedAt;

    /** Nguoi tao ra membership nay. */
    @Column(name = "added_by")
    private UUID addedBy;

    /** Tao moi GroupMember voi thoi gian join tu dong. */
    public static GroupMember create(com.hanghai.kchtg.user.entity.User user, UserGroup userGroup, GroupMemberRole role, UUID addedBy) {
        GroupMember member = new GroupMember();
        member.setUser(user);
        member.setUserGroup(userGroup);
        member.setRole(role != null ? role : GroupMemberRole.MEMBER);
        member.setAddedBy(addedBy);
        member.setJoinedAt(java.time.LocalDateTime.now());
        member.setStatus(GroupMemberStatus.ACTIVE);
        return member;
    }
}
