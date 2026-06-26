package com.hanghai.kchtg.group.service;

import com.hanghai.kchtg.group.dto.AddGroupMemberRequest;
import com.hanghai.kchtg.group.dto.CreateGroupRequest;
import com.hanghai.kchtg.group.dto.UpdateGroupRequest;
import com.hanghai.kchtg.group.entity.*;
import com.hanghai.kchtg.group.repository.GroupHistoryRepository;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service quan ly nhom nguoi dung (User Group).
 */
@Service
@Transactional
public class UserGroupService {

    private static final Logger log = LoggerFactory.getLogger(UserGroupService.class);

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupHistoryRepository groupHistoryRepository;

    public UserGroupService(GroupRepository groupRepository,
                            GroupMemberRepository groupMemberRepository,
                            GroupHistoryRepository groupHistoryRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupHistoryRepository = groupHistoryRepository;
    }

    // ── Query ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserGroup> findAll() {
        return groupRepository.findAll();
    }

    @Transactional(readOnly = true)
    public UserGroup findById(UUID id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhóm với id: " + id));
    }

    @Transactional(readOnly = true)
    public UserGroup findByCode(String code) {
        return groupRepository.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhóm với mã: " + code));
    }

    @Transactional(readOnly = true)
    public List<GroupMember> findMembers(UUID groupId) {
        return groupMemberRepository.findByGroupId(groupId, GroupMemberStatus.ACTIVE);
    }

    // ── Mutate ──────────────────────────────────────────────────────

    /**
     * Tao moi nhom.
     */
    public UserGroup create(CreateGroupRequest request, UUID operatorId, String operatorName) {
        if (groupRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã nhóm đã tồn tại: " + request.getCode());
        }

        UserGroup group = new UserGroup();
        group.setName(request.getName());
        group.setCode(request.getCode());
        group.setDescription(request.getDescription());
        group.setPermissions(request.getPermissions() != null ? new ArrayList<>(request.getPermissions()) : new ArrayList<>());
        group.setStatus(GroupStatus.ACTIVE);

        UserGroup saved = groupRepository.save(group);

        // Ghi lich su
        saveHistory(saved.getId(), saved.getName(), saved.getCode(), "CREATED",
                null, operatorId, operatorName);

        log.info("Created group: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Cap nhat thong tin nhom.
     */
    public UserGroup update(UUID id, UpdateGroupRequest request, UUID operatorId, String operatorName) {
        UserGroup group = findById(id);
        StringBuilder details = new StringBuilder();

        if (request.getName() != null && !request.getName().equals(group.getName())) {
            details.append("Ten: ").append(group.getName()).append(" -> ").append(request.getName()).append("; ");
            group.setName(request.getName());
        }
        if (request.getDescription() != null && !request.getDescription().equals(group.getDescription())) {
            details.append("Mo da thay doi; ");
            group.setDescription(request.getDescription());
        }
        if (request.getPermissions() != null) {
            group.setPermissions(new ArrayList<>(request.getPermissions()));
            details.append("Danh sach quyen da cap nhat; ");
        }

        UserGroup saved = groupRepository.save(group);

        if (details.length() > 0) {
            saveHistory(saved.getId(), saved.getName(), saved.getCode(), "UPDATED",
                    details.toString(), operatorId, operatorName);
        }

        log.info("Updated group: {} ({})", saved.getCode(), saved.getId());
        return saved;
    }

    /**
     * Xoa nhom (soft delete).
     */
    public void delete(UUID id, UUID operatorId, String operatorName) {
        UserGroup group = findById(id);
        String details = String.format("Xoa nhom '%s' (code: %s)", group.getName(), group.getCode());
        saveHistory(group.getId(), group.getName(), group.getCode(), "DELETED",
                details, operatorId, operatorName);
        group.softDelete();
        groupRepository.save(group);
        log.info("Soft-deleted group: {} ({})", group.getCode(), group.getId());
    }

    /**
     * Them thanh vien vao nhom.
     */
    public GroupMember addMember(UUID groupId, AddGroupMemberRequest request, UUID operatorId) {
        UserGroup group = findById(groupId);

        // Kiem tra membership da ton tai
        Optional<GroupMember> existing = groupMemberRepository
                .findByUserIdAndUserGroupId(request.getUserId(), groupId);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Người dùng đã là thành viên của nhóm này");
        }

        GroupMember member = GroupMember.create(null, group, request.getRole(), operatorId);
        GroupMember saved = groupMemberRepository.save(member);

        saveHistory(groupId, group.getName(), group.getCode(),
                "MEMBER_ADDED", "Da them user " + request.getUserId(), operatorId, null);

        return saved;
    }

    /**
     * Rời nhom (remove member).
     */
    public void removeMember(UUID memberId, UUID operatorId, String operatorName) {
        GroupMember member = groupMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy membership với id: " + memberId));
        member.setStatus(GroupMemberStatus.REMOVED);
        groupMemberRepository.save(member);

        saveHistory(member.getUserGroup().getId(),
                member.getUserGroup().getName(),
                member.getUserGroup().getCode(),
                "MEMBER_REMOVED", "Da roi nhom boi " + operatorName,
                operatorId, operatorName);
    }

    // ── Private ─────────────────────────────────────────────────────

    private void saveHistory(UUID userGroupId, String name, String code,
                             String action, String details, UUID changedBy, String changedByName) {
        GroupHistory history = GroupHistory.create(userGroupId, action, details, changedBy, changedByName);
        history.setGroupName(name);
        history.setGroupCode(code);
        groupHistoryRepository.save(history);
    }
}
