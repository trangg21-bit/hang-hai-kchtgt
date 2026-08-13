package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.password.entity.PasswordHistory;
import com.hanghai.kchtg.password.repository.PasswordHistoryRepository;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.dto.UserResponse;
import com.hanghai.kchtg.user.dto.UserListItemResponse;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.entity.UserStatusLog;
import com.hanghai.kchtg.user.exception.ValidationException;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.repository.UserListProjection;
import com.hanghai.kchtg.user.repository.UserStatusLogRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.text.Normalizer;

/**
 * Service quan ly tai khoan nguoi dung.
 * <p>
 * {@code @Transactional} tai class-level de tat ca public method deu
 * chay trong transaction - tranh {@code LazyInitializationException}
 * khi {@code spring.jpa.open-in-view=false}.
 * Read methods dung {@code findAllWithRelations()} /
 * {@code findByIdWithRelations()}
 * de JOIN FETCH cac lazy associations.
 * </p>
 */
@Service
@Transactional
public class UserService {

    private static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email không được để trống");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final GroupRepository groupRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final PermissionCacheService permissionCacheService;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final UserStatusLogRepository userStatusLogRepository;
    private final EntityManager entityManager;
    private final com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService;

    public UserService(UserRepository userRepository,
            RoleRepository roleRepository,
            OrgUnitRepository orgUnitRepository,
            GroupRepository groupRepository,
            PasswordEncoder passwordEncoder,
            PasswordPolicyValidator passwordPolicyValidator,
            PermissionCacheService permissionCacheService,
            PasswordHistoryRepository passwordHistoryRepository,
            UserStatusLogRepository userStatusLogRepository,
            EntityManager entityManager) {
        this(userRepository, roleRepository, orgUnitRepository, groupRepository, passwordEncoder,
                passwordPolicyValidator, permissionCacheService, passwordHistoryRepository,
                userStatusLogRepository, entityManager, null);
    }

    @Autowired
    public UserService(UserRepository userRepository,
            RoleRepository roleRepository,
            OrgUnitRepository orgUnitRepository,
            GroupRepository groupRepository,
            PasswordEncoder passwordEncoder,
            PasswordPolicyValidator passwordPolicyValidator,
            PermissionCacheService permissionCacheService,
            PasswordHistoryRepository passwordHistoryRepository,
            UserStatusLogRepository userStatusLogRepository,
            EntityManager entityManager,
            @org.springframework.lang.Nullable com.hanghai.kchtg.orgunit.service.OrgUnitCacheService orgUnitCacheService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.groupRepository = groupRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyValidator = passwordPolicyValidator;
        this.permissionCacheService = permissionCacheService;
        this.passwordHistoryRepository = passwordHistoryRepository;
        this.userStatusLogRepository = userStatusLogRepository;
        this.entityManager = entityManager;
        this.orgUnitCacheService = orgUnitCacheService;
    }

    // =========================================================================

    /**
     * T-001: Lay danh sach nguoi dung voi phan trang (Pageable).
     * Default 20 items/page, max 100.
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(String search, UserStatus status, Pageable pageable) {
        // Enforce max page size
        int actualSize = pageable.getPageSize();
        if (actualSize > MAX_PAGE_SIZE || actualSize <= 0) {
            actualSize = MAX_PAGE_SIZE;
        }

        Sort sort = pageable.getSort();
        if (sort == null || sort.isUnsorted()) {
            sort = Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT);
        }

        Pageable cappedPageable = PageRequest.of(
                pageable.getPageNumber(),
                actualSize,
                sort);

        // We always use searchUsers if we have search, roleCode, or status filters, or
        // we can use it universally!
        return userRepository.searchUsers(
                toSearchLike(search),
                status,
                cappedPageable).map(u -> UserResponse.from(u, orgUnitCacheService));
    }

    /**
     * T-001: Lay danh sach nguoi dung kem theo thong ke statusCounts trong 1
     * response duy nhat.
     */
    @Transactional(readOnly = true)
    public com.hanghai.kchtg.user.dto.UserPageResponse findAllWithCounts(String search,
            UserStatus status, Pageable pageable) {
        return findAllWithCounts(search, status, null, pageable);
    }

    @Transactional(readOnly = true)
    public com.hanghai.kchtg.user.dto.UserPageResponse findAllWithCounts(String search,
            UserStatus status, UUID orgUnitId, Pageable pageable) {
        int actualSize = pageable.getPageSize();
        if (actualSize > MAX_PAGE_SIZE || actualSize <= 0) {
            actualSize = MAX_PAGE_SIZE;
        }

        Sort sort = pageable.getSort();
        if (sort == null || sort.isUnsorted()) {
            sort = Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT);
        }

        Pageable cappedPageable = PageRequest.of(
                pageable.getPageNumber(),
                actualSize,
                sort);

        String searchLike = toSearchLike(search);
        List<UserListProjection> listItems = orgUnitId == null
                ? userRepository.searchUserList(searchLike, status, cappedPageable)
                : userRepository.searchUserListByOrgUnit(searchLike, status, orgUnitId, cappedPageable);

        // The status tabs must describe the same filtered result set as the
        // table.  Using the global counts here makes a search for one user
        // still show the totals of the whole user database.
        java.util.Map<String, Long> counts = getStatusCounts(search, orgUnitId);
        long totalElements = status == null
                ? counts.getOrDefault("total", 0L)
                : counts.getOrDefault(status.name().toLowerCase(java.util.Locale.ROOT), 0L);
        Page<UserListItemResponse> pageResult = new PageImpl<>(
                listItems.stream()
                        .map(u -> UserListItemResponse.from(u, orgUnitCacheService))
                        .toList(),
                cappedPageable,
                totalElements);

        return new com.hanghai.kchtg.user.dto.UserPageResponse(
                pageResult.getContent(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                counts);
    }

    /**
     * Thong ke so luong nguoi dung theo tung trang thai (1 single SQL query).
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getStatusCounts(String search) {
        return getStatusCounts(search, null);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> getStatusCounts(String search, UUID orgUnitId) {
        java.util.Map<String, Long> counts = new java.util.HashMap<>();
        counts.put("total", 0L);
        for (UserStatus s : UserStatus.values()) {
            if (s != UserStatus.DELETED) {
                counts.put(s.name().toLowerCase(java.util.Locale.ROOT), 0L);
            }
        }

        List<Object[]> results = orgUnitId == null
                ? userRepository.countUsersByStatus(toSearchLike(search))
                : userRepository.countUsersByStatusAndOrgUnit(toSearchLike(search), orgUnitId);
        long total = 0;
        for (Object[] row : results) {
            UserStatus s = (UserStatus) row[0];
            Number c = (Number) row[1];
            if (s != null && s != UserStatus.DELETED) {
                long val = c.longValue();
                counts.put(s.name().toLowerCase(java.util.Locale.ROOT), val);
                total += val;
            }
        }
        counts.put("total", total);
        return counts;
    }

    /**
     * Chuẩn hóa từ khóa tìm kiếm để DB tìm được cả tiếng Việt có dấu và không
     * dấu. Kết quả vẫn dùng LIKE chứa nên "Van A" khớp "Nguyễn Văn An".
     */
    private static String toSearchLike(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        String normalized = Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('\u0111', 'd')
                .replace('\u0110', 'd');
        return "%" + normalized + "%";
    }

    /**
     * T-001: Lay danh sach toan bo nguoi dung (backwards compat, JOIN FETCH).
     */
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAllWithRelations();
    }

    /**
     * Tim nguoi dung theo ID (JOIN FETCH orgUnit + groups).
     *
     * @throws EntityNotFoundException neu khong tim thay
     */
    @Transactional(readOnly = true)
    public User findById(UUID id) {
        return userRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với id: " + id));
    }

    /**
     * Tim nguoi dung theo ten dang nhap (JOIN FETCH orgUnit + groups).
     *
     * @throws EntityNotFoundException neu khong tim thay
     */
    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        return userRepository.findByUsernameWithRelations(username)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với username: " + username));
    }

    /**
     * Tim nguoi dung theo email.
     *
     * @throws EntityNotFoundException neu khong tim thay
     */
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    // =========================================================================

    /**
     * Tao moi nguoi dung.
     *
     * @throws IllegalArgumentException neu username hoac email da ton tai
     * @throws ValidationException      neu mat khau khong dap ung chinh sach
     */
    public User create(CreateUserRequest request) {
        // BR-001: Check email unique
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại: " + request.getUsername());
        }
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(email)) {
            throw new IllegalArgumentException("Email đã tồn tại: " + email);
        }

        // BR-002: Validate password policy
        passwordPolicyValidator.validate(request.getPassword());

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(email);
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setStatus(UserStatus.ACTIVE);

        // Set OrgUnit relationship
        if (request.getOrgUnitId() != null) {
            OrgUnit orgUnit = orgUnitRepository.findById(request.getOrgUnitId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy đơn vị với id: " + request.getOrgUnitId()));
            user.setOrgUnit(orgUnit);
        }

        // Set UserGroup relationships
        if (request.getGroupIds() != null && !request.getGroupIds().isEmpty()) {
            List<UserGroup> groups = groupRepository.findAllById(request.getGroupIds());
            if (groups.size() != request.getGroupIds().size()) {
                throw new IllegalArgumentException("Một số nhóm không tồn tại");
            }
            user.setGroups(new ArrayList<>(groups));
        }

        User saved = userRepository.save(user);
        savePasswordHistory(saved.getId(), saved.getPassword());
        log.info("Created user: {} ({})", saved.getUsername(), saved.getId());
        return saved;
    }

    /**
     * Cap nhat thong tin nguoi dung. Chi cap nhat nhung truong duoc gui (khac
     * {@code null}).
     *
     * @throws EntityNotFoundException  neu khong tim thay nguoi dung
     * @throws IllegalArgumentException neu email moi da duoc dung boi nguoi dung
     *                                  khac
     */
    public User update(UUID id, UpdateUserRequest request) {
        User user = findById(id);

        if (request.getStatus() != null && request.getStatus() != user.getStatus()) {
            user = changeStatus(id, request.getStatus(), "Cập nhật trạng thái từ biểu mẫu chỉnh sửa");
        }

        if (request.getEmail() != null) {
            String email = normalizeEmail(request.getEmail());
            if (userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(email, user.getId())) {
                throw new IllegalArgumentException("Email đã tồn tại: " + email);
            }
            user.setEmail(email);
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            // Validate password policy on update
            passwordPolicyValidator.validate(request.getPassword());
            // BR-014: check password history (last 3 passwords)
            checkPasswordHistory(user.getId(), request.getPassword());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        boolean permissionsChanged = false;

        if (request.getOrgUnitId() != null) {
            OrgUnit orgUnit = orgUnitRepository.findById(request.getOrgUnitId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy đơn vị với id: " + request.getOrgUnitId()));
            if (user.getOrgUnit() == null || !user.getOrgUnit().getId().equals(orgUnit.getId())) {
                user.setOrgUnit(orgUnit);
                // BR-275-12: Org hierarchy change -> invalidate token version & clear cache
                permissionsChanged = true;
                permissionCacheService.invalidateAndIncrementVersion(user.getId());
            }
        }

        if (permissionsChanged) {
            user.incrementPermissionVersion();
        }

        User saved = userRepository.save(user);
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            savePasswordHistory(saved.getId(), saved.getPassword());
        }
        if (permissionsChanged) {
            permissionCacheService.invalidateCache(saved.getId());
        }
        log.info("Updated user: {} ({})", saved.getUsername(), saved.getId());
        return saved;
    }

    /**
     * T-002: Xoa nguoi dung (BR-003 guard).
     * Kiem tra kha nhien phanhen/bao cao FK references truoc khi soft delete.
     *
     * @throws IllegalArgumentException neu nguoi dung co du lieu nghiep vu lien
     *                                  quan (BR-003)
     * @throws EntityNotFoundException  neu khong tim thay nguoi dung
     */
    public void delete(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với id: " + id));

        // BR-003: Data-dependency check — query phanhen/bao cao FK references
        // If FK constraints exist in the DB, this will fail at constraint level.
        // We also check here to provide a user-friendly error message.
        checkBusinessDataReferences(user);

        user.softDelete(com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId());
        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
        log.info("Soft-deleted user: {} ({})", user.getUsername(), id);
    }

    /**
     * T-002: Kiem tra du lieu nghiep vu lien quan den nguoi dung (BR-003).
     * Queries information_schema for all FK tables referencing app_users,
     * plus any table with audit columns (created_by / updated_by / deleted_by /
     * etc.)
     * pointing to this user. Blocks delete if any references exist.
     */
    private void checkBusinessDataReferences(User user) {
        List<String> ignoredSystemTables = List.of(
                "app_users", "password_history", "user_status_log",
                "user_roles", "app_user_roles", "user_group_members",
                "group_members", "pending_approvals", "password_expiration_log");

        // 1. Query information_schema for all FK tables AND exact column names
        // referencing app_users
        @SuppressWarnings("unchecked")
        List<Object[]> fkReferences = entityManager.createNativeQuery(
                "SELECT DISTINCT kcu.table_name, kcu.column_name FROM information_schema.table_constraints AS tc " +
                        "JOIN information_schema.key_column_usage AS kcu " +
                        "ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema " +
                        "JOIN information_schema.constraint_column_usage AS ccu " +
                        "ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema " +
                        "WHERE tc.constraint_type = 'FOREIGN KEY' " +
                        "AND ccu.table_name = 'app_users' " +
                        "AND tc.table_schema = 'public'")
                .getResultList();

        // 2. Check each dependent table using its exact foreign key column name
        for (Object[] row : fkReferences) {
            String tbl = (String) row[0];
            String col = (String) row[1];
            if (ignoredSystemTables.contains(tbl))
                continue;

            Number count = (Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM " + tbl + " WHERE " + col + " = :userId").setParameter("userId", user.getId())
                    .getSingleResult();
            if (count.longValue() > 0) {
                throw new IllegalStateException("Không thể xóa — tài khoản còn dữ liệu nghiệp vụ liên quan");
            }
        }

        // 3. Check any table with audit columns referencing this user
        @SuppressWarnings("unchecked")
        List<Object[]> refColumns = entityManager.createNativeQuery(
                "SELECT DISTINCT c.table_name, c.column_name, c.data_type FROM information_schema.columns c " +
                        "WHERE c.table_schema = 'public' " +
                        "AND c.column_name IN ('created_by','updated_by','deleted_by','approved_by','assigned_by','changed_by','operator_id') "
                        +
                        "ORDER BY c.table_name")
                .getResultList();

        for (Object[] row : refColumns) {
            String tbl = (String) row[0];
            String col = (String) row[1];
            if (ignoredSystemTables.contains(tbl))
                continue;

            String dataType = (String) row[2];
            String userIdExpression;
            if ("uuid".equalsIgnoreCase(dataType)) {
                userIdExpression = "CAST(:userId AS uuid)";
            } else if ("character varying".equalsIgnoreCase(dataType)
                    || "character".equalsIgnoreCase(dataType)
                    || "text".equalsIgnoreCase(dataType)) {
                // Some legacy audit columns (for example
                // adjustment_approvals.approved_by) intentionally remain text.
                userIdExpression = "CAST(:userId AS text)";
            } else {
                // A UUID user identifier cannot meaningfully match numeric/date
                // audit columns; skip those columns instead of aborting deletion.
                log.debug("Skipping unsupported audit column type {}.{} ({})", tbl, col, dataType);
                continue;
            }

            Number count = (Number) entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM \"" + tbl.replace("\"", "\"\"") + "\" WHERE \""
                            + col.replace("\"", "\"\"") + "\" = " + userIdExpression)
                    .setParameter("userId", user.getId()).getSingleResult();
            if (count.longValue() > 0) {
                throw new IllegalStateException("Không thể xóa — tài khoản còn dữ liệu nghiệp vụ liên quan");
            }
        }
        log.info("BR-003: No business data references found for user {} — soft delete allowed", user.getUsername());
    }

    // =========================================================================
    // BR-014: Password history helpers
    // =========================================================================

    private void checkPasswordHistory(UUID userId, String newRawPassword) {
        List<PasswordHistory> recentPasswords = passwordHistoryRepository.findTopNByUserIdOrderByCreatedAtDesc(userId,
                3);
        for (PasswordHistory ph : recentPasswords) {
            if (passwordEncoder.matches(newRawPassword, ph.getPasswordHash())) {
                throw new IllegalArgumentException("Mật khẩu mới không được trùng với 3 mật khẩu gần nhất");
            }
        }
    }

    private void savePasswordHistory(UUID userId, String encodedPassword) {
        PasswordHistory ph = new PasswordHistory();
        ph.setUserId(userId);
        ph.setPasswordHash(encodedPassword);
        passwordHistoryRepository.save(ph);
    }

    /**
     * Thay doi trang thai tai khoan nguoi dung (BR-001-07 / BR-015).
     * Logs status change to UserStatusLog with reason.
     *
     * @throws EntityNotFoundException neu khong tim thay nguoi dung
     */
    public User changeStatus(UUID id, UserStatus status, String reason) {
        User user = findById(id);
        UserStatus oldStatus = user.getStatus();
        if (oldStatus == status) {
            return user;
        }
        user.setStatus(status);
        User saved = userRepository.save(user);

        // BR-001-07 / BR-015: log status change
        UserStatusLog logEntry = new UserStatusLog();
        logEntry.setUserId(saved.getId());
        logEntry.setOldStatus(oldStatus);
        logEntry.setNewStatus(status);
        logEntry.setReason(reason);
        logEntry.setOperatorId(SecurityUtils.getCurrentUserId());
        userStatusLogRepository.save(logEntry);

        log.info("Changed status of user {} from {} to {} (reason: {})",
                saved.getUsername(), oldStatus, status, reason);
        return saved;
    }

    // =========================================================================
    // T-004: Self-edit endpoint (GET/PUT /users/me)
    // =========================================================================

    /**
     * T-004: GET /users/me — tra ve thong tin nguoi dung dang dang nhap hien tai.
     *
     * @throws EntityNotFoundException neu khong tim thay nguoi dung dang nhap
     */
    @Transactional(readOnly = true)
    public UserResponse getMyProfile() {
        String username = getCurrentUsername();
        if (username == null) {
            throw new EntityNotFoundException("Không tìm thấy người dùng đang đăng nhập");
        }
        User user = findByUsername(username);
        return UserResponse.from(user);
    }

    /**
     * T-004: PUT /users/me — cho phep nguoi dung hien tai cap nhat thong tin cua
     * chinh minh.
     * Chi cho phep cap nhat fullName, phone. Email yeu cau xac minh (khong cap nhat
     * truc tiep).
     *
     * @throws AccessDeniedException   neu nguoi dung khong phai la admin va hien
     *                                 tai co the cap nhat
     * @throws EntityNotFoundException neu khong tim thay nguoi dung dang nhap
     */
    public UserResponse updateMyProfile(UpdateUserRequest request) {
        String username = getCurrentUsername();
        if (username == null) {
            throw new EntityNotFoundException("Không tìm thấy người dùng đang đăng nhập");
        }
        User user = findByUsername(username);

        // Admin can update more fields; regular users only fullName + phone
        boolean isAdmin = isCurrentUserAdmin();

        // Validate password if provided
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            passwordPolicyValidator.validate(request.getPassword());
            // BR-014: check password history (last 3 passwords)
            checkPasswordHistory(user.getId(), request.getPassword());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Email update: only admins can change email for security reasons
        if (!isAdmin && request.getEmail() != null) {
            throw new AccessDeniedException("Chỉ quản trị viên mới được thay đổi email");
        }
        if (request.getEmail() != null) {
            String email = normalizeEmail(request.getEmail());
            if (userRepository.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(email, user.getId())) {
                throw new IllegalArgumentException("Email đã tồn tại: " + email);
            }
            user.setEmail(email);
        }

        // Self can update fullName and phone
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        // Admin can update orgUnit and groups. Permission assignments are managed
        // through UserPermissionService so every grant/revoke is audited.
        if (isAdmin) {
            if (request.getOrgUnitId() != null) {
                OrgUnit orgUnit = orgUnitRepository.findById(request.getOrgUnitId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Không tìm thấy đơn vị với id: " + request.getOrgUnitId()));
                user.setOrgUnit(orgUnit);
            }
            if (request.getGroupIds() != null) {
                List<UserGroup> groups = request.getGroupIds().isEmpty()
                        ? List.of()
                        : groupRepository.findAllById(request.getGroupIds());
                user.setGroups(new ArrayList<>(groups));
            }
        }

        User saved = userRepository.save(user);
        // BR-014: save to password history if password was changed
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            savePasswordHistory(saved.getId(), saved.getPassword());
        }
        log.info("Updated self profile: {}", saved.getUsername());
        return UserResponse.from(saved);
    }

    /**
     * T-012: Admin reset password cho user bat ky (relaxed policy).
     * Chi yeu cau >= 8 ky tu, co chu va so (khong yeu cau ky tu dac biet).
     *
     * @throws EntityNotFoundException neu khong tim thay nguoi dung
     */
    public User resetPasswordByAdmin(UUID userId, String newPassword) {
        User user = findById(userId);
        // Relaxed policy for admin reset: >= 8 chars, contains letter + digit, no
        // special char required
        validateResetPassword(newPassword, true);
        // BR-014: check password history (last 3 passwords)
        checkPasswordHistory(user.getId(), newPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        // Reset lockout counter on password reset
        user.setFailedLoginCount(0);
        user.setAccountLockedUntil(null);
        user.setPasswordHashVersion((user.getPasswordHashVersion() != null ? user.getPasswordHashVersion() + 1 : 1));
        User saved = userRepository.save(user);
        // BR-014: save to password history
        savePasswordHistory(saved.getId(), saved.getPassword());
        log.info("Admin reset password for user: {}", saved.getUsername());
        return saved;
    }

    /**
     * T-008: GET /users/{id}/pending-status — tra ve trang thai dang ky dang cho
     * phep duyet.
     * Chi cho phep user xem trang thai cua chinh minh.
     *
     * @throws AccessDeniedException neu khong phai la user hien tai
     */
    @Transactional(readOnly = true)
    public String getPendingStatus(UUID targetUserId) {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            throw new EntityNotFoundException("Không tìm thấy người dùng đang đăng nhập");
        }

        // Get current user's ID to compare
        User currentUser = findByUsername(currentUsername);
        if (!currentUser.getId().equals(targetUserId)) {
            throw new AccessDeniedException("Chỉ được xem trạng thái đăng ký của chính mình");
        }

        // Check if user has a pending approval record
        // We'll use the PendingApprovalService when it exists
        log.info("Checking pending approval status for user: {} ({})", currentUsername, targetUserId);
        return "pending";
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Lay username hien tai tu SecurityContext.
     */
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        return null;
    }

    /**
     * Kiem tra xem user hien tai co phai admin khong.
     */
    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            return auth.getAuthorities().stream()
                    .anyMatch(a -> "admin:manage".equals(a.getAuthority())
                            || "admin:*".equals(a.getAuthority())
                            || "*".equals(a.getAuthority()));
        }
        return false;
    }

    /**
     * Validate password cho reset (admin = policy nong nhe hon).
     */
    private void validateResetPassword(String password, boolean adminReset) {
        if (password == null || password.isEmpty()) {
            throw new ValidationException("Mật khẩu không được để trống");
        }
        if (password.length() < 8) {
            throw new ValidationException("Mật khẩu phải có ít nhất 8 ký tự");
        }
        if (password.length() > 128) {
            throw new ValidationException("Mật khẩu tối đa 128 ký tự");
        }
        // Admin reset: only letter + digit required, no special char needed
        if (!adminReset) {
            // Full policy for non-admin reset
            passwordPolicyValidator.validate(password);
        }
    }
}
