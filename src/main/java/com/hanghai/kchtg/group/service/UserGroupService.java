package com.hanghai.kchtg.group.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.group.dto.*;
import com.hanghai.kchtg.group.entity.*;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.PermissionRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service quan ly nhom nguoi dung (User Group).
 * <p>
 * M-001 F-002: Implements all business rules:
 * - BR-008: Unique group name and code validation
 * - BR-009: Cannot delete group with members
 * - BR-010: User can belong to multiple groups
 * - BR-011: Only Admin can delete groups
 * </p>
 */
@Service
@Transactional
public class UserGroupService {

    private static final Logger log = LoggerFactory.getLogger(UserGroupService.class);

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final UUID UNRESTRICTED_SCOPE_PLACEHOLDER = new UUID(0L, 0L);
    private static final Set<String> NON_INHERITABLE_PERMISSIONS = Set.of(
            "group:manage", "admin:all", "orgunit:scope_all", "*");

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PermissionCacheService permissionCacheService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;

    public UserGroupService(GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            PermissionCacheService permissionCacheService,
            OrgUnitCacheService orgUnitCacheService,
            OrgUnitScopeService orgUnitScopeService) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.permissionCacheService = permissionCacheService;
        this.orgUnitCacheService = orgUnitCacheService;
        this.orgUnitScopeService = orgUnitScopeService;
    }

    // ── CRUD ────────────────────────────────────────────────────────

    /**
     * Tao moi nhom (BR-008: unique name/code validation).
     */
    public UserGroup create(CreateUserGroupRequest request, UUID operatorId, String operatorName) {
        requireOrganizationInScope(request.getOrganizationId());
        String name = request.getName().trim();
        String code = request.getCode().trim();
        String description = request.getDescription() == null ? null : request.getDescription().trim();

        // BR-008: Check unique name
        if (groupRepository.existsByNameAndDeletedAtIsNull(name)) {
            throw new IllegalArgumentException("Tên nhóm đã tồn tại: " + name);
        }

        // BR-008: Check unique code
        if (groupRepository.existsByCodeAndDeletedAtIsNull(code)) {
            throw new IllegalArgumentException("Mã nhóm đã tồn tại: " + code);
        }

        UserGroup group = new UserGroup();
        group.setName(name);
        group.setCode(code);
        group.setDescription(description);
        group.setOrganizationId(request.getOrganizationId());
        group.setStatus(request.getStatus() != null ? request.getStatus() : GroupStatus.ACTIVE);
        group.setPermissions(new java.util.ArrayList<>());

        UserGroup saved = groupRepository.save(group);

        log.info("Created group: {} ({}) by {}", saved.getCode(), saved.getId(), operatorName);
        return saved;
    }

    /**
     * Cap nhat thong tin nhom (BR-008: unique name re-check).
     */
    public UserGroup update(UUID id, UpdateUserGroupRequest request, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(id);

        String name = request.getName() == null ? null : request.getName().trim();
        if (name != null && !name.equals(group.getName())) {
            // BR-008: Re-check unique name on update (exclude current group)
            if (groupRepository.existsByNameAndIdNotAndDeletedAtIsNull(name, id)) {
                throw new IllegalArgumentException("Tên nhóm đã tồn tại: " + name);
            }
            group.setName(name);
        }

        if (request.getDescription() != null && !request.getDescription().equals(group.getDescription())) {
            group.setDescription(request.getDescription().trim());
        }

        if (request.getStatus() != null && request.getStatus() != group.getStatus()) {
            group.setStatus(request.getStatus());
        }

        UserGroup saved = groupRepository.save(group);

        log.info("Updated group: {} ({}) by {}", saved.getCode(), saved.getId(), operatorName);
        return saved;
    }

    /**
     * Xoa nhom (BR-009: member count check, BR-011: Admin-only enforced by
     * controller).
     */
    public void delete(UUID id, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(id);

        // BR-009: Check member count before delete
        long activeMemberCount = groupMemberRepository
                .countByUserGroupIdAndStatus(id, GroupMemberStatus.ACTIVE);
        if (activeMemberCount > 0) {
            throw new IllegalStateException(
                    "Không thể xóa nhóm còn " + activeMemberCount + " thành viên");
        }

        group.softDelete(operatorId);
        groupRepository.save(group);
        log.info("Soft-deleted group: {} ({}) by {}", group.getCode(), group.getId(), operatorName);
    }

    // ── Query (pagination, search, filter) ──────────────────────────

    /**
     * Liet ke nhom (phan trang, search, filter) — AC-010, AC-011.
     */
    @Transactional(readOnly = true)
    public PaginatedGroupResponse list(String search, String statusStr, UUID organizationIdFilter,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, size > 0 ? size : DEFAULT_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));

        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        Integer statusInt = (statusStr != null && !statusStr.isBlank())
                ? GroupStatus.fromValue(statusStr).ordinal()
                : null;

        // Data scope: Admin Cục sees all; regular users see their org unit tree.
        OrgUnitScopeService.Scope scope = currentUserScope();
        if (!scope.unrestricted() && scope.orgUnitIds().isEmpty()) {
            return emptyGroupPage(page, size, true);
        }
        List<UUID> organizationIds = resolveOrganizationFilter(scope, organizationIdFilter);
        if (organizationIds != null && organizationIds.isEmpty()) {
            return emptyGroupPage(page, size, true);
        }
        boolean unrestricted = organizationIds == null;
        List<UUID> queryOrganizationIds = unrestricted
                ? organizationIdsForQuery(scope)
                : organizationIds;

        Page<UserGroup> pageResult = groupRepository.searchAndFilter(searchParam, statusInt,
                unrestricted, queryOrganizationIds, pageable);

        List<GroupResponse> items = pageResult.getContent().stream()
                .map(g -> UserGroupResponse.from(g,
                        groupMemberRepository.countByUserGroupIdAndStatus(g.getId(), GroupMemberStatus.ACTIVE),
                        orgUnitCacheService.getName(g.getOrganizationId())))
                .map(this::toGroupResponse)
                .toList();

        long activeCount = groupRepository.countByFiltersAndStatus(searchParam,
                unrestricted, queryOrganizationIds, GroupStatus.ACTIVE.ordinal());
        long inactiveCount = groupRepository.countByFiltersAndStatus(searchParam,
                unrestricted, queryOrganizationIds, GroupStatus.INACTIVE.ordinal());

        PaginatedGroupResponse result = new PaginatedGroupResponse();
        result.setItems(items);
        result.setTotal(pageResult.getTotalElements());
        result.setPage(pageResult.getNumber());
        result.setPageSize(pageResult.getSize());
        result.setActiveCount(activeCount);
        result.setInactiveCount(inactiveCount);
        return result;
    }

    /**
     * My groups filter (Ca nhan) — AC-013, US-008.
     * Only returns groups where the current user is a member.
     */
    @Transactional(readOnly = true)
    public PaginatedGroupResponse findMyGroups(UUID userId, String search, String statusStr, UUID organizationIdFilter,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, size > 0 ? size : DEFAULT_PAGE_SIZE,
                Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));

        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        Integer statusInt = (statusStr != null && !statusStr.isBlank())
                ? GroupStatus.fromValue(statusStr).ordinal()
                : null;

        // Data scope for my groups too — pushed to DB query
        OrgUnitScopeService.Scope scope = currentUserScope();
        if (!scope.unrestricted() && scope.orgUnitIds().isEmpty()) {
            return emptyGroupPage(page, size, false);
        }
        List<UUID> organizationIds = resolveOrganizationFilter(scope, organizationIdFilter);
        if (organizationIds != null && organizationIds.isEmpty()) {
            return emptyGroupPage(page, size, false);
        }
        boolean unrestricted = organizationIds == null;
        List<UUID> queryOrganizationIds = unrestricted
                ? organizationIdsForQuery(scope)
                : organizationIds;

        Page<UserGroup> pageResult = groupRepository.searchAndFilterMyGroups(
                searchParam, statusInt, userId, unrestricted, queryOrganizationIds, pageable);

        List<GroupResponse> items = pageResult.getContent().stream()
                .map(g -> UserGroupResponse.from(g,
                        groupMemberRepository.countByUserGroupIdAndStatus(g.getId(), GroupMemberStatus.ACTIVE),
                        orgUnitCacheService.getName(g.getOrganizationId())))
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
     * Lay chi tiet mot nhom (with memberCount + organizationName) — AC-001.
     */
    @Transactional(readOnly = true)
    public UserGroupResponse findById(UUID id) {
        UserGroup entity = groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhóm với id=" + id));

        if (!currentUserScope().allows(entity.getOrganizationId())) {
            throw new AccessDeniedException("Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p nhÃ³m ngoÃ i pháº¡m vi Ä‘Æ¡n vá»‹ Ä‘Æ°á»£c phÃ¢n quyá»n");
        }

        long memberCount = groupMemberRepository
                .countByUserGroupIdAndStatus(id, GroupMemberStatus.ACTIVE);

        return UserGroupResponse.from(entity, memberCount, orgUnitCacheService.getName(entity.getOrganizationId()),
                resolveUserDisplayName(entity.getCreatedBy()),
                resolveUserDisplayName(entity.getUpdatedBy()));
    }

    // ── Lock / Unlock (F-002 AC-002-15, AC-002-16) ──────────────────

    /**
     * Khóa/Mở khóa nhóm — chuyển đổi ACTIVE ↔ INACTIVE.
     */
    public UserGroup lockGroup(UUID id, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(id);
        List<UUID> memberUserIds = groupMemberRepository
                .findUserIdsByUserGroupIdAndStatus(id, GroupMemberStatus.ACTIVE);

        if (group.getStatus() == GroupStatus.ACTIVE) {
            group.setStatus(GroupStatus.INACTIVE);
        } else {
            group.setStatus(GroupStatus.ACTIVE);
        }

        UserGroup saved = groupRepository.save(group);

        // Group status is part of the effective permission calculation. Refresh every
        // active member so a locked group stops contributing inherited permissions
        // immediately, and an unlocked group can contribute them again.
        memberUserIds.forEach(permissionCacheService::invalidateAndIncrementVersion);

        log.info("Toggled group status: {} ({}) by {}", saved.getCode(), saved.getId(), operatorName);
        return saved;
    }

    /**
     * Lay entity theo id (for internal use).
     */
    @Transactional(readOnly = true)
    private UserGroup findEntityByIdScoped(UUID id) {
        UserGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + id));
        if (!currentUserScope().allows(group.getOrganizationId())) {
            throw new AccessDeniedException("Group is outside the permitted organisation scope");
        }
        return group;
    }

    @Transactional(readOnly = true)
    public UserGroup findEntityById(UUID id) { return findEntityByIdScoped(id); }
    /*
        UserGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhóm với id=" + id));
    }

    // ── Group Permission ────────────────────────────────────────────

    /** Lấy danh sách role hiện đang được gán cho nhóm. */
    /*
        if (!currentUserScope().allows(group.getOrganizationId())) {
            throw new AccessDeniedException("Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p nhÃ³m ngoÃ i pháº¡m vi Ä‘Æ¡n vá»‹ Ä‘Æ°á»£c phÃ¢n quyá»n");
        }
        return group;
    }

    */

    @Transactional(readOnly = true)
    public List<String> findGroupPermissions(UUID groupId) {
        UserGroup group = findEntityById(groupId);
        return normalizedPermissions(group.getPermissions()).stream()
                .filter(permission -> !NON_INHERITABLE_PERMISSIONS.contains(permission))
                .toList();
    }

    public List<String> updateGroupPermissions(UUID groupId,
            UpdateGroupPermissionsRequest request, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(groupId);
        List<String> requested = normalizedPermissions(request.getPermissions());

        List<String> forbiddenCodes = requested.stream()
                .filter(NON_INHERITABLE_PERMISSIONS::contains)
                .toList();
        if (!forbiddenCodes.isEmpty()) {
            throw new IllegalArgumentException("Không thể gán quyền đặc biệt cho nhóm: "
                    + String.join(", ", forbiddenCodes));
        }

        Set<String> knownCodes = permissionRepository.findByCodeIn(requested).stream()
                .map(permission -> permission.getCode().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
        if (knownCodes.size() != requested.size()) {
            List<String> unknownCodes = requested.stream()
                    .filter(code -> !knownCodes.contains(code))
                    .toList();
            throw new IllegalArgumentException("Danh sách quyền chứa mã không tồn tại: "
                    + String.join(", ", unknownCodes));
        }

        group.setPermissions(new ArrayList<>(requested));
        groupRepository.save(group);

        for (UUID userId : groupMemberRepository.findUserIdsByUserGroupIdAndStatus(
                groupId, GroupMemberStatus.ACTIVE)) {
            permissionCacheService.invalidateAndIncrementVersion(userId);
        }

        return requested;
    }

    private List<String> normalizedPermissions(List<String> permissions) {
        if (permissions == null) {
            return List.of();
        }
        return permissions.stream()
                .filter(Objects::nonNull)
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroupRoleResponse> findGroupRoles(UUID groupId) {
        UserGroup group = findEntityById(groupId);
        return group.getRoles().stream()
                .filter(role -> role.getStatus() == com.hanghai.kchtg.user.entity.RoleStatus.ACTIVE)
                .map(GroupRoleResponse::from)
                .toList();
    }

    /**
     * Thay thế toàn bộ danh sách role của nhóm. Thành viên active được tăng
     * permission version và xóa cache để JWT/quyền mới có hiệu lực ngay.
     */
    public List<GroupRoleResponse> updateGroupRoles(UUID groupId,
            UpdateGroupRolesRequest request, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(groupId);
        Set<UUID> requestedIds = request.getRoleIds() == null
                ? Set.of()
                : request.getRoleIds().stream().filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toSet());

        List<Role> roles = requestedIds.isEmpty() ? List.of() : roleRepository.findAllById(requestedIds);
        Set<UUID> foundIds = roles.stream().map(Role::getId).collect(java.util.stream.Collectors.toSet());
        if (foundIds.size() != requestedIds.size()) {
            Set<UUID> missing = new HashSet<>(requestedIds);
            missing.removeAll(foundIds);
            throw new IllegalArgumentException("Vai trò không tồn tại hoặc đã bị vô hiệu: " + missing);
        }
        if (roles.stream().anyMatch(role -> role.getStatus() != com.hanghai.kchtg.user.entity.RoleStatus.ACTIVE)) {
            throw new IllegalArgumentException("Chỉ được gán vai trò đang hoạt động");
        }

        group.setRoles(new HashSet<>(roles));
        groupRepository.save(group);

        for (UUID userId : groupMemberRepository.findUserIdsByUserGroupIdAndStatus(
                groupId, GroupMemberStatus.ACTIVE)) {
            permissionCacheService.invalidateAndIncrementVersion(userId);
        }

        return roles.stream().map(GroupRoleResponse::from).toList();
    }

    // ── Member management ───────────────────────────────────────────

    /**
     * Them thanh vien vao nhom (BR-010: duplicate check).
     */
    public GroupMember addMember(UUID groupId, AddGroupMemberRequest request, UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(groupId);

        // Handle soft-deleted re-add (BR-010 constraint)
        java.util.Optional<GroupMember> existingMemberOpt = groupMemberRepository
                .findByUserIdAndUserGroupId(request.getUserId(), groupId);
        GroupMember saved;
        User user = getUserById(request.getUserId());

        if (user == null) {
            throw new IllegalArgumentException("Không tìm thấy user với id=" + request.getUserId());
        }

        if (existingMemberOpt.isPresent()) {
            GroupMember existingMember = existingMemberOpt.get();
            if (existingMember.getStatus() == GroupMemberStatus.ACTIVE) {
                throw new IllegalArgumentException("Người dùng đã thuộc nhóm này");
            }
            // Resurrect member
            existingMember.setStatus(GroupMemberStatus.ACTIVE);
            existingMember.setAddedBy(operatorId);
            existingMember.setJoinedAt(java.time.LocalDateTime.now());
            saved = groupMemberRepository.save(existingMember);
        } else {
            GroupMember member = GroupMember.create(user, group, operatorId);
            saved = groupMemberRepository.save(member);
        }

        // Keep the effective-permissions relationship in sync. User#getAllPermissions
        // resolves inherited permissions through User.groups, while group_members is
        // the audit/listing projection used by this module.
        attachGroupToUser(user, group);
        permissionCacheService.invalidateAndIncrementVersion(user.getId());

        log.info("Added member {} to group {} by {}", request.getUserId(), group.getCode(), operatorName);
        return saved;
    }

    /**
     * Thêm nhiều thành viên trong một transaction. Toàn bộ dữ liệu được kiểm tra
     * trước khi ghi để tránh trạng thái thêm một phần.
     */
    public BatchAddGroupMembersResponse addMembers(UUID groupId, BatchAddGroupMembersRequest request,
            UUID operatorId, String operatorName) {
        UserGroup group = findEntityById(groupId);
        List<UUID> userIds = request.getUserIds() == null ? List.of() : request.getUserIds();

        if (userIds.isEmpty() || userIds.size() > 100) {
            throw new IllegalArgumentException("Mỗi lần chỉ được thêm từ 1 đến 100 người dùng");
        }
        if (new HashSet<>(userIds).size() != userIds.size()) {
            throw new IllegalArgumentException("Danh sách người dùng không được trùng lặp");
        }

        List<User> users = userIds.stream().map(this::getUserById).toList();
        if (users.stream().anyMatch(Objects::isNull)) {
            throw new IllegalArgumentException("Danh sách chứa người dùng không tồn tại");
        }

        List<GroupMember> existingMembers = userIds.stream()
                .map(userId -> groupMemberRepository.findByUserIdAndUserGroupId(userId, groupId).orElse(null))
                .toList();
        if (existingMembers.stream().anyMatch(member -> member != null && member.getStatus() == GroupMemberStatus.ACTIVE)) {
            throw new IllegalArgumentException("Một hoặc nhiều người dùng đã thuộc nhóm này");
        }

        for (int i = 0; i < userIds.size(); i++) {
            GroupMember existingMember = existingMembers.get(i);
            if (existingMember != null) {
                existingMember.setStatus(GroupMemberStatus.ACTIVE);
                existingMember.setAddedBy(operatorId);
                existingMember.setJoinedAt(java.time.LocalDateTime.now());
                groupMemberRepository.save(existingMember);
            } else {
                groupMemberRepository.save(GroupMember.create(users.get(i), group, operatorId));
            }
            attachGroupToUser(users.get(i), group);
            permissionCacheService.invalidateAndIncrementVersion(users.get(i).getId());
        }

        log.info("Added {} members to group {} by {}", userIds.size(), group.getCode(), operatorName);
        return new BatchAddGroupMembersResponse(userIds.size(), userIds);
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
                    "Không tìm thấy thành viên có id=" + userId + " trong nhóm " + group.getCode());
        }

        com.hanghai.kchtg.user.entity.User targetUser = getUserById(userId);
        if (targetUser != null) {
            targetUser.getGroups().removeIf(userGroup -> group.getId().equals(userGroup.getId()));
            userRepository.save(targetUser);
            permissionCacheService.invalidateAndIncrementVersion(targetUser.getId());
        }
        log.info("Removed member {} from group {} by {}", userId, group.getCode(), operatorName);
    }

    /**
     * Liet ke thanh vien cua nhom (phan trang).
     */
    @Transactional(readOnly = true)
    public Page<GroupMember> findMembers(UUID groupId, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size > 0 ? size : DEFAULT_PAGE_SIZE,
                Sort.by(Sort.Direction.ASC, "joinedAt"));
        findEntityById(groupId); // verify group exists

        String searchParam = (search != null && !search.isBlank()) ? "%" + search.trim() + "%" : null;
        return groupMemberRepository.searchMembers(groupId, GroupMemberStatus.ACTIVE, searchParam, pageable);
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
                response.getOrganizationId(),
                response.getOrganizationName(),
                response.getCreatedAt(),
                response.getUpdatedAt(),
                response.getMemberCount());
    }

    /**
     * Resolve the audit user from real user data for the group detail response.
     */
    private String resolveUserDisplayName(UUID userId) {
        if (userId == null) {
            return null;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        String fullName = user.getFullName();
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim();
        }
        return user.getUsername();
    }

    /**
     * Resolve the organizationId filter for data scope.
     * Returns null for Admin Cục (sees all); returns the current user's orgUnit.id
     * for others.
     */
    private OrgUnitScopeService.Scope currentUserScope() {
        return orgUnitScopeService == null
                ? OrgUnitScopeService.Scope.allScope()
                : orgUnitScopeService.currentUserScope();
    }

    private List<UUID> organizationIdsForQuery(OrgUnitScopeService.Scope scope) {
        return scope.unrestricted() ? List.of(UNRESTRICTED_SCOPE_PLACEHOLDER) : scope.orgUnitIds();
    }

    /**
     * Resolve the selected organisation as a subtree filter while preserving
     * the caller's data scope. A null result means unrestricted access; an
     * empty result means the selected organisation is outside the caller's
     * permitted tree.
     */
    private List<UUID> resolveOrganizationFilter(OrgUnitScopeService.Scope scope,
            UUID organizationIdFilter) {
        if (organizationIdFilter == null) {
            return scope.unrestricted() ? null : scope.orgUnitIds();
        }
        if (!scope.unrestricted() && !scope.allows(organizationIdFilter)) {
            return List.of();
        }

        List<UUID> selectedTree = orgUnitScopeService == null
                ? List.of(organizationIdFilter)
                : orgUnitScopeService.resolveSubtreeIds(organizationIdFilter);
        if (scope.unrestricted()) {
            return selectedTree;
        }
        return selectedTree.stream()
                .filter(scope.orgUnitIds()::contains)
                .toList();
    }

    private void requireOrganizationInScope(UUID organizationId) {
        if (!currentUserScope().allows(organizationId)) {
            throw new AccessDeniedException("Báº¡n khÃ´ng cÃ³ quyá»n táº¡o hoáº·c thay Ä‘á»•i nhÃ³m ngoÃ i pháº¡m vi Ä‘Æ¡n vá»‹ Ä‘Æ°á»£c phÃ¢n quyá»n");
        }
    }

    private PaginatedGroupResponse emptyGroupPage(int page, int size, boolean includeStatusCounts) {
        PaginatedGroupResponse result = new PaginatedGroupResponse();
        result.setItems(List.of());
        result.setTotal(0);
        result.setPage(Math.max(page, 0));
        result.setPageSize(size > 0 ? size : DEFAULT_PAGE_SIZE);
        if (includeStatusCounts) {
            result.setActiveCount(0);
            result.setInactiveCount(0);
        }
        return result;
    }

    /**
     * Validate user exists in F-001 UserAccount (cross-module read).
     */
    private User getUserById(UUID userId) {
        return userRepository.findById(userId).orElse(null);
    }

    /**
     * Synchronize the permission-inheritance projection used by
     * User#getAllPermissions.
     */
    private void attachGroupToUser(User user, UserGroup group) {
        boolean groupAttached = user.getGroups().stream()
                .anyMatch(existingGroup -> group.getId().equals(existingGroup.getId()));
        if (!groupAttached) {
            user.getGroups().add(group);
            userRepository.save(user);
        }
    }
}
