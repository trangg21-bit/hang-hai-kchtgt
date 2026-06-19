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
 * Service quan ly tai khoan nguoi dung.
 * <p>
 * {@code @Transactional} o class-level de tat ca public method deu
 * chay trong transaction — tranh {@code LazyInitializationException}
 * khi {@code spring.jpa.open-in-view=false}.
 * Read methods dung {@code findAllWithRelations()} / {@code findByIdWithRelations()}
 * de JOIN FETCH các lazy associations.
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

    // ── Query ───────────────────────────────────────────────────────

    /**
     * Lay danh sach tong bo nguoi dung (JOIN FETCH orgUnit + groups).
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
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nguoi dung voi id: " + id));
    }

    /**
     * Tim nguoi dung theo ten dang nhap (JOIN FETCH orgUnit + groups).
     *
     * @throws EntityNotFoundException neu khong tim thay
     */
    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        return userRepository.findByUsernameWithRelations(username)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nguoi dung voi username: " + username));
    }

    /**
     * Tim nguoi dung theo email.
     *
     * @throws EntityNotFoundException neu khong tim thay
     */
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nguoi dung voi email: " + email));
    }

    // ── Mutate ──────────────────────────────────────────────────────

    /**
     * Tao moi nguoi dung.
     *
     * @throws IllegalArgumentException neu username hoăc email da ton tai
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
     * Cap nhat thong tin nguoi dung. Chi cap nhat nhung truong duoc gui (khac {@code null}).
     *
     * @throws EntityNotFoundException neu khong tim thay nguoi dung
     * @throws IllegalArgumentException neu email moi da duoc dung boi nguoi dung khac
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
                            "Khong tim thay don vi voi id: " + request.getOrgUnitId()));
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
     * Xoa nguoi dung (soft delete — dung BaseEntity.softDelete()).
     *
     * @throws EntityNotFoundException neu khong tim thay nguoi dung
     */
    public void delete(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Khong tim thay nguoi dung voi id: " + id));
        user.softDelete();
        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
        log.info("Soft-deleted user: {}", id);
    }

    /**
     * Thay doi trang tai tai khoan nguoi dung.
     *
     * @throws EntityNotFoundException neu khong tim thay nguoi dung
     */
    public User changeStatus(UUID id, UserStatus status) {
        User user = findById(id);
        user.setStatus(status);
        User saved = userRepository.save(user);
        log.info("Changed status of user {} to {}", saved.getUsername(), status);
        return saved;
    }
}
