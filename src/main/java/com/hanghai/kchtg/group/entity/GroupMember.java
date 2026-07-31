package com.hanghai.kchtg.group.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Quan he giua nguoi dung va nhom. */
@Entity
@Table(name = "group_members")
@Getter
@Setter
@NoArgsConstructor
public class GroupMember extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_group_id", nullable = false)
    private UserGroup userGroup;

    @Enumerated(EnumType.ORDINAL)
    @Column(nullable = false)
    private GroupMemberStatus status = GroupMemberStatus.ACTIVE;

    @Column(name = "joined_at")
    private java.time.LocalDateTime joinedAt;

    @Column(name = "added_by")
    private UUID addedBy;

    public static GroupMember create(User user, UserGroup userGroup, UUID addedBy) {
        GroupMember member = new GroupMember();
        member.setUser(user);
        member.setUserGroup(userGroup);
        member.setAddedBy(addedBy);
        member.setJoinedAt(java.time.LocalDateTime.now());
        member.setStatus(GroupMemberStatus.ACTIVE);
        return member;
    }
}
