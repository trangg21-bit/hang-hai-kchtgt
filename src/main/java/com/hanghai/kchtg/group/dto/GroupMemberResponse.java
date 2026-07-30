package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin thành viên nhóm (with full user details).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponse {

    private String id;
    private String userId;
    private String username;
    private String fullName;
    private String groupId;
    private String groupName;
    private String roleInGroup;
    private String status;
    private String email;
    private LocalDateTime joinedAt;
    private LocalDateTime createdAt;

    /**
     * Map from GroupMember entity, loading eagerly associated user/group data.
     */
    public static GroupMemberResponse from(GroupMember member) {
        GroupMemberResponse resp = new GroupMemberResponse();
        resp.setId(member.getId().toString());
        resp.setStatus(member.getStatus() != null ? member.getStatus().name() : null);
        resp.setRoleInGroup(member.getRole() != null ? member.getRole().getValue() : null);
        resp.setJoinedAt(member.getJoinedAt());
        resp.setCreatedAt(member.getCreatedAt());

        if (member.getUser() != null) {
            User user = member.getUser();
            resp.setUserId(user.getId().toString());
            resp.setUsername(user.getUsername());
            resp.setFullName(user.getFullName());
            resp.setEmail(user.getEmail());
        }
        if (member.getUserGroup() != null) {
            resp.setGroupId(member.getUserGroup().getId().toString());
            resp.setGroupName(member.getUserGroup().getName());
        }
        return resp;
    }

}
