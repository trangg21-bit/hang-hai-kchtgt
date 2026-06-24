package com.hanghai.kchtg.user.service;

import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service quản lý tài khoản người dùng.
 * <p>
 * {@code @Transactional} ở class-level để tất cả public method đều
 * chạy trong transaction - tránh {@code LazyInitializationException}
 * khi {@code spring.jpa.open-in-view=false}.
 * Read methods dùng {@code findAllWithRelations()} / {@code findByIdWithRelations()}
 * để JOIN FETCH các lazy associations.
 * </p>
 */
@Service
@Transactional
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final GroupRepository groupRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       OrgUnitRepository orgUnitRepository,
                       GroupRepository groupRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.groupRepository = groupRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================================

    /**
     * Lấy danh sách toàn bộ người dùng (JOIN FETCH orgUnit + groups).
     */
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAllWithRelations();
    }

    /**
     * Tìm người dùng theo ID (JOIN FETCH orgUnit + groups).
     *
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public User findById(UUID id) {
        return userRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với id: " + id));
    }

    /**
     * Tìm người dùng theo tên đăng nhập (JOIN FETCH orgUnit + groups).
     *
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        return userRepository.findByUsernameWithRelations(username)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với username: " + username));
    }

    /**
     * Tìm người dùng theo email.
     *
     * @throws EntityNotFoundException nếu không tìm thấy
     */
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    // =========================================================================

    /**
     * Tạo mới người dùng.
     *
     * @throws IllegalArgumentException nếu username hoặc email đã tồn tại
     */
    public User create(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại: " + request.getEmail());
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole() != null ? request.getRole() : "ROLE_USER");
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
        log.info("Created user: {} ({})", saved.getUsername(), saved.getId());
        return saved;
    }

    /**
     * Cập nhật thông tin người dùng. Chỉ cập nhật những trường được gửi (khác {@code null}).
     *
     * @throws EntityNotFoundException nếu không tìm thấy người dùng
     * @throws IllegalArgumentException nếu email mới đã được dùng bởi người dùng khác
     */
    public User update(UUID id, UpdateUserRequest request) {
        User user = findById(id);

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email đã tồn tại: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
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

        User saved = userRepository.save(user);
        log.info("Updated user: {} ({})", saved.getUsername(), saved.getId());
        return saved;
    }

    /**
     * Xóa người dùng (soft delete - dùng BaseEntity.softDelete()).
     *
     * @throws EntityNotFoundException nếu không tìm thấy người dùng
     */
    public void delete(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với id: " + id));
        user.softDelete();
        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
        log.info("Soft-deleted user: {}", id);
    }

    /**
     * Thay đổi trạng thái tài khoản người dùng.
     *
     * @throws EntityNotFoundException nếu không tìm thấy người dùng
     */
    public User changeStatus(UUID id, UserStatus status) {
        User user = findById(id);
        user.setStatus(status);
        User saved = userRepository.save(user);
        log.info("Changed status of user {} to {}", saved.getUsername(), status);
        return saved;
    }
}