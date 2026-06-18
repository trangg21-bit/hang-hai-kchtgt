package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.user.entity.User;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin thành viên nhóm.
 */
public class GroupMemberResponse {

    private String id;
    private String userId;
    private String username;
    private String fullName;
    private String groupId;
    private String groupName;
    private String role;
    private String status;
    private LocalDateTime joinedAt;
    private LocalDateTime createdAt;

    public GroupMemberResponse() {}

    public static GroupMemberResponse from(GroupMember member) {
        GroupMemberResponse resp = new GroupMemberResponse();
        resp.setId(member.getId().toString());
        resp.setStatus(member.getStatus().name());
        resp.setRole(member.getRole());
        resp.setJoinedAt(member.getJoinedAt());
        resp.setCreatedAt(member.getCreatedAt());

        if (member.getUser() != null) {
            User user = member.getUser();
            resp.setUserId(user.getId().toString());
            resp.setUsername(user.getUsername());
            resp.setFullName(user.getFullName());
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
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
