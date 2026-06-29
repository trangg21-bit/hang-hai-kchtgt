package com.hanghai.kchtg.group.service;

import com.hanghai.kchtg.group.dto.AddGroupMemberRequest;
import com.hanghai.kchtg.group.dto.CreateUserGroupRequest;
import com.hanghai.kchtg.group.dto.GroupCopyRequest;
import com.hanghai.kchtg.group.dto.GroupResponse;
import com.hanghai.kchtg.group.dto.PaginatedGroupResponse;
import com.hanghai.kchtg.group.dto.UpdateUserGroupRequest;
import com.hanghai.kchtg.group.dto.UserGroupResponse;
import com.hanghai.kchtg.group.entity.GroupHistory;
import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.GroupMemberStatus;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.group.repository.GroupHistoryRepository;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service quan ly nhom nguoi dung (User Group).
 * <p>
 * M-001 F-002: Implements all business rules:
 * - BR-008: Unique group name and code validation
 * - BR-009: Cannot delete group with members
 * - BR-010: User can belong to multiple groups
 * - BR-011: Only Admin can delete groups
 * - BR-012: GroupType enum validation (department/project/custom)
 * - BR-014: Copy group with all members
 * - BR-015: All mutations logged to GroupHistory
 * </p>
 */
@Service
@Transactional
public class UserGroupService {

    private static final Logger log = LoggerFactory.getLogger(UserGroupService.class);

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupHistoryRepository groupHistoryRepository;
    private final UserRepository userRepository;

    public UserGroupService(GroupRepository groupRepository,
                            GroupMemberRepository groupMemberRepository,
                            GroupHistoryRepository groupHistoryRepository,
                            UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupHistoryRepository = groupHistoryRepository;
        this.userRepository = userRepository;
    }

    // ── CRUD ────────────────────────────────────────────────────────

    /**
     * Tao moi nhom (BR-008: unique name/code, BR-012: groupType validation).
     */
    public UserGroup create(CreateUserGroupRequest request, UUID operatorId, String operatorName) {
        // BR-008: Check unique name
        if (groupRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Tên nhóm đã tồn tại: " + request.getName());
        }

        // BR-008: Check unique code
        if (groupRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã nhóm đã tồn tại: " + request.getCode());
        }

        // BR-012: Validate groupType
        String groupType = request.getGroupType() != null ? request.getGroupType().trim() : "custom";
        try {
            com.hanghai.kchtg.group.entity.GroupType.fromValue(groupType);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Loại nhóm không hợp lệ: " + groupType
                + ". Phải là: department, project, hoặc custom");
        }

        UserGroup group = new UserGroup();
        group.setName(request.getName());
        group.setCode(request.getCode());
        group.setDescription(request.getDescription());
        group.setGroupType(groupType);
        group.setStatus(GroupStatus.ACTIVE);
        group.setPermissions(new java.util.ArrayList<>());

        UserGroup saved = groupRepository.save(group);

        // BR-015: Log history
        saveHistory(saved.getId(), saved.getName(), saved.getCode(), "CREATED",
                "Da tao nhom moi", operatorId, operatorName);

        log.info("Created group: {} ({}) by {}", saved.getCode(), saved.getId(), operatorName);
        return saved;
    }

    /**
     * Cap nhat thong tin nhom (BR-008: unique name re-check).
     */
    public UserGroup update(UUID id, UpdateUserGroupRequest request, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(id);
        StringBuilder details = new StringBuilder();

        if (request.getName() != null && !request.getName().equals(group.getName())) {
            // BR-008: Re-check unique name on update (exclude current group)
            if (groupRepository.existsByNameAndIdNot(request.getName(), id)) {
                throw new IllegalArgumentException("Tên nhóm đã tồn tại: " + request.getName());
            }
            details.append("Ten: ").append(group.getName()).append(" -> ").append(request.getName()).append("; ");
            group.setName(request.getName());
        }

        if (request.getDescription() != null && !request.getDescription().equals(group.getDescription())) {
            details.append("Mo ta da cap nhat; ");
            group.setDescription(request.getDescription());
        }

        if (request.getGroupType() != null && !request.getGroupType().equals(group.getGroupType())) {
            // BR-012: Validate groupType
            try {
                com.hanghai.kchtg.group.entity.GroupType.fromValue(request.getGroupType());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Loại nhóm không hợp lệ: " + request.getGroupType());
            }
            details.append("Loai nhom: ").append(group.getGroupType()).append(" -> ").append(request.getGroupType()).append("; ");
            group.setGroupType(request.getGroupType());
        }

        UserGroup saved = groupRepository.save(group);

        if (details.length() > 0) {
            saveHistory(saved.getId(), saved.getName(), saved.getCode(), "UPDATED",
                    details.toString(), operatorId, operatorName);
        }

        log.info("Updated group: {} ({}) by {}", saved.getCode(), saved.getId(), operatorName);
        return saved;
    }

    /**
     * Xoa nhom (BR-009: member count check, BR-011: Admin-only enforced by controller).
     */
    public void delete(UUID id, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(id);

        // BR-009: Check member count before delete
        long activeMemberCount = groupMemberRepository
                .countByUserGroupIdAndStatus(id, GroupMemberStatus.ACTIVE);
        if (activeMemberCount > 0) {
            throw new IllegalStateException(
                "Khong the xoa nhom con " + activeMemberCount + " thanh vien");
        }

        // BR-015: Log history before delete
        saveHistory(group.getId(), group.getName(), group.getCode(), "DELETED",
                "Da xoa nhom '" + group.getName() + "'", operatorId, operatorName);

        group.softDelete();
        groupRepository.save(group);
        log.info("Soft-deleted group: {} ({}) by {}", group.getCode(), group.getId(), operatorName);
    }

    // ── Query (pagination, search, filter) ──────────────────────────

    /**
     * Liet ke nhom (phan trang, search, filter) — AC-010, AC-011.
     */
    @Transactional(readOnly = true)
    public PaginatedGroupResponse list(String search, String groupType, String status,
                                       int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.max(size, DEFAULT_PAGE_SIZE),
                                           Sort.by(Sort.Direction.DESC, "createdAt"));

        String searchParam = (search != null && !search.isBlank()) ? "%" + search + "%" : null;

        Page<UserGroup> pageResult = groupRepository.searchAndFilter(searchParam, groupType, status, pageable);

        List<GroupResponse> items = pageResult.getContent().stream()
                .map(g -> UserGroupResponse.from(g,
                        groupMemberRepository.countByUserGroupIdAndStatus(g.getId(), GroupMemberStatus.ACTIVE)))
                .map(this::toGroupResponse)
                .toList();

        PaginatedGroupResponse result = new PaginatedGroupResponse();
        result.setItems(items);
        result.setTotal(pageResult.getTotalElements());
        result.setPage(pageResult.getNumber());
        result.setPageSize(pageResult.getSize());
        return result;
    }

    /**
     * My groups filter (Ca nhan) — AC-013, US-008.
     * Only returns groups where the current user is a member.
     */
    @Transactional(readOnly = true)
    public PaginatedGroupResponse findMyGroups(UUID userId, String search, String groupType,
                                               int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.max(size, DEFAULT_PAGE_SIZE),
                                           Sort.by(Sort.Direction.DESC, "createdAt"));

        String searchParam = (search != null && !search.isBlank()) ? "%" + search + "%" : null;

        Page<UserGroup> pageResult = groupRepository.searchAndFilterMyGroups(
                searchParam, groupType, userId, pageable);

        List<GroupResponse> items = pageResult.getContent().stream()
                .map(g -> UserGroupResponse.from(g,
                        groupMemberRepository.countByUserGroupIdAndStatus(g.getId(), GroupMemberStatus.ACTIVE)))
                .map(this::toGroupResponse)
                .toList();

        PaginatedGroupResponse result = new PaginatedGroupResponse();
        result.setItems(items);
        result.setTotal(pageResult.getTotalElements());
        result.setPage(pageResult.getNumber());
        result.setPageSize(pageResult.getSize());
        return result;
    }

    /**
     * Lay chi tiet mot nhom (with memberCount) — AC-001.
     */
    @Transactional(readOnly = true)
    public UserGroupResponse findById(UUID id) {
        UserGroup entity = groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nhom voi id=" + id));

        long memberCount = groupMemberRepository
                .countByUserGroupIdAndStatus(id, GroupMemberStatus.ACTIVE);

        return UserGroupResponse.from(entity, memberCount);
    }

    /**
     * Lay entity theo id (for internal use).
     */
    @Transactional(readOnly = true)
    public UserGroup findEntityById(UUID id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nhom voi id=" + id));
    }

    // ── Member management ───────────────────────────────────────────

    /**
     * Them thanh vien vao nhom (BR-010: duplicate check).
     */
    public GroupMember addMember(UUID groupId, AddGroupMemberRequest request, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(groupId);

        // Duplicate membership check (BR-010)
        boolean alreadyMember = groupMemberRepository
                .existsByUserIdAndUserGroupIdAndStatus(request.getUserId(), groupId, GroupMemberStatus.ACTIVE);
        if (alreadyMember) {
            throw new IllegalArgumentException("Nguoi dung da thuoc nhom nay");
        }

        // Validate user exists (cross-module: F-001 UserAccount)
        com.hanghai.kchtg.user.entity.User user = getUserById(request.getUserId());
        if (user == null) {
            throw new IllegalArgumentException("Khong tim thay user voi id=" + request.getUserId());
        }

        GroupMember member = GroupMember.create(user, group,
                request.getRoleInGroup() != null ? request.getRoleInGroup() : "member",
                operatorId);
        GroupMember saved = groupMemberRepository.save(member);

        // BR-015: Log history
        saveHistory(groupId, group.getName(), group.getCode(), "MEMBER_ADDED",
                "Da them user " + request.getUserId() + " (" + user.getUsername() + ")",
                operatorId, operatorName);

        log.info("Added member {} to group {} by {}", request.getUserId(), group.getCode(), operatorName);
        return saved;
    }

    /**
     * Xoa thanh vien khoi nhom.
     */
    public void removeMember(UUID groupId, UUID userId, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(groupId);

        int removed = groupMemberRepository
                .removeMember(userId, groupId, GroupMemberStatus.ACTIVE, GroupMemberStatus.REMOVED);

        if (removed == 0) {
            throw new IllegalArgumentException(
                "Khong tim thay thanh vien co id=" + userId + " trong nhom " + group.getCode());
        }

        // BR-015: Log history
        com.hanghai.kchtg.user.entity.User targetUser = getUserById(userId);
        String userRef = targetUser != null ? targetUser.getUsername() : userId.toString();
        saveHistory(groupId, group.getName(), group.getCode(), "MEMBER_REMOVED",
                "Da xoa user " + userRef + " khoi nhom", operatorId, operatorName);

        log.info("Removed member {} from group {} by {}", userId, group.getCode(), operatorName);
    }

    /**
     * Liet ke thanh vien cua nhom (phan trang).
     */
    @Transactional(readOnly = true)
    public Page<GroupMember> findMembers(UUID groupId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.max(size, DEFAULT_PAGE_SIZE),
                                           Sort.by(Sort.Direction.ASC, "joinedAt"));
        findEntityById(groupId); // verify group exists

        return groupMemberRepository.findByGroupIdWithUser(groupId, GroupMemberStatus.ACTIVE, pageable);
    }

    // ── Copy group (BR-014) ────────────────────────────────────────

    /**
     * Sao cop nhom (BR-014): clone group + all members, atomic transaction.
     */
    public UserGroup copy(UUID sourceGroupId, GroupCopyRequest request, UUID operatorId, String operatorName) {
        UserGroup source = findEntityById(sourceGroupId);

        // Create new group (clone)
        UserGroup copy = new UserGroup();
        copy.setName(request.getName() != null ? request.getName()
                : source.getName() + " (Sao cop)");
        copy.setCode(source.getCode() + "-COPY-" + UUID.randomUUID().toString().substring(0, 6));
        copy.setDescription(request.getDescription() != null ? request.getDescription()
                : source.getDescription());
        copy.setGroupType(source.getGroupType());
        copy.setStatus(GroupStatus.ACTIVE);
        copy.setPermissions(new java.util.ArrayList<>(source.getPermissions()));

        UserGroup savedCopy = groupRepository.save(copy);

        // Clone all active members with joinedBy = currentAdmin (BR-014)
        List<GroupMember> sourceMembers = groupMemberRepository
                .findByGroupIdWithUser(sourceGroupId, GroupMemberStatus.ACTIVE,
                                       org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE))
                .getContent();

        for (GroupMember srcMember : sourceMembers) {
            GroupMember newMember = new GroupMember();
            newMember.setUser(srcMember.getUser());
            newMember.setUserGroup(savedCopy);
            newMember.setRole(srcMember.getRole());
            newMember.setAddedBy(operatorId);
            newMember.setJoinedAt(java.time.LocalDateTime.now());
            newMember.setStatus(GroupMemberStatus.ACTIVE);
            groupMemberRepository.save(newMember);
        }

        // BR-015: Log history
        saveHistory(source.getId(), source.getName(), source.getCode(), "COPIED",
                "Da sao cop thanh nhom '" + savedCopy.getName() + "' (code: " + savedCopy.getCode() + ")",
                operatorId, operatorName);

        log.info("Copied group {} -> {} by {}", source.getCode(), savedCopy.getCode(), operatorName);
        return savedCopy;
    }

    // ── History (BR-015) ───────────────────────────────────────────

    /**
     * Lay lich su thay doi cua nhom (sorted by performedAt DESC).
     */
    @Transactional(readOnly = true)
    public List<GroupHistory> findHistory(UUID groupId) {
        findEntityById(groupId); // verify group exists
        return groupHistoryRepository.findByUserGroupIdOrderByPerformedAtDesc(groupId);
    }

    /**
     * Lay lich su thay doi cua nhom (phan trang).
     */
    @Transactional(readOnly = true)
    public Page<GroupHistory> findHistoryPaginated(UUID groupId, int page, int size) {
        findEntityById(groupId);
        Pageable pageable = PageRequest.of(page, Math.max(size, DEFAULT_PAGE_SIZE),
                                           Sort.by(Sort.Direction.DESC, "performedAt"));
        return groupHistoryRepository.findByUserGroupIdOrderByPerformedAtDesc(groupId, pageable);
    }

    // ── Private helpers ─────────────────────────────────────────────

    private GroupResponse toGroupResponse(UserGroupResponse response) {
        return new GroupResponse(
                response.getId(),
                response.getName(),
                response.getCode(),
                response.getDescription(),
                null, // permissions not available from UserGroupResponse
                response.getStatus(),
                response.getCreatedAt(),
                response.getUpdatedAt()
        );
    }

    private void saveHistory(UUID userGroupId, String name, String code,
                             String action, String notes, UUID changedBy, String changedByName) {
        GroupHistory history = GroupHistory.create(userGroupId, action, notes, changedBy, changedByName);
        history.setGroupName(name);
        history.setGroupCode(code);
        groupHistoryRepository.save(history);
    }

    /**
     * Validate user exists in F-001 UserAccount (cross-module read).
     */
    private User getUserById(UUID userId) {
        return userRepository.findById(userId).orElse(null);
    }
}
