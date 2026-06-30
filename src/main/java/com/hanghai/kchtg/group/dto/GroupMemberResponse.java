package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.GroupMemberStatus;
import com.hanghai.kchtg.user.entity.User;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin thành viên nhóm (with full user details).
 */
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

    public GroupMemberResponse() {}

    /**
     * Map from GroupMember entity, loading eagerly associated user/group data.
     */
    public static GroupMemberResponse from(GroupMember member) {
        GroupMemberResponse resp = new GroupMemberResponse();
        resp.setId(member.getId().toString());
        resp.setStatus(member.getStatus() != null ? member.getStatus().name() : null);
        resp.setRoleInGroup(member.getRole());
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

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getRoleInGroup() { return roleInGroup; }
    public void setRoleInGroup(String roleInGroup) { this.roleInGroup = roleInGroup; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
