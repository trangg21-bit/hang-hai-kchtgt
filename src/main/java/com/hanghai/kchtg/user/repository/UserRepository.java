package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link User}.
 */
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Tìm người dùng theo tên đăng nhập.
     */
    Optional<User> findByUsername(String username);

    /**
     * Tìm người dùng theo email.
     */
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Kiểm tra tồn tại tên đăng nhập.
     */
    boolean existsByUsername(String username);

    /**
     * Kiểm tra tồn tại email.
     */
    boolean existsByEmail(String email);

    /**
     * Kiểm tra email đang được sử dụng, không phân biệt chữ hoa/chữ thường.
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Kiểm tra email đang được một tài khoản chưa xóa sử dụng, không phân biệt hoa/thường.
     */
    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    /**
     * Kiểm tra email trùng khi cập nhật, ngoại trừ chính tài khoản đang được sửa.
     */
    boolean existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(String email, UUID id);

    /**
     * Kiểm tra tồn tại số điện thoại.
     */
    boolean existsByPhone(String phone);

    /**
     * Tìm người dùng theo số điện thoại.
     */
    Optional<User> findByPhone(String phone);

    /**
     * Tìm người dùng theo email HOẶC số điện thoại (dùng cho đăng nhập đa dạng).
     */
    @Query("SELECT u FROM User u WHERE u.email = :emailOrPhone OR u.phone = :emailOrPhone")
    Optional<User> findByEmailOrPhone(String emailOrPhone);

    /**
     * Tìm người dùng theo username HOẶC email (dùng cho đăng nhập F-273).
     */
    @Query("SELECT u FROM User u WHERE u.username = :usernameOrEmail OR u.email = :usernameOrEmail")
    Optional<User> findByUsernameOrEmail(String usernameOrEmail);

    /**
     * Tìm tất cả người dùng với JOIN FETCH để tránh LazyInitializationException.
     */
    @Query("SELECT DISTINCT u FROM User u "
            + "LEFT JOIN FETCH u.orgUnit "
            + "LEFT JOIN FETCH u.groups "
            + "LEFT JOIN FETCH u.roles")
    List<User> findAllWithRelations();

    /**
     * Tìm người dùng theo ID với JOIN FETCH.
     */
    @Query("SELECT u FROM User u "
            + "LEFT JOIN FETCH u.orgUnit "
            + "LEFT JOIN FETCH u.groups "
            + "LEFT JOIN FETCH u.roles "
            + "WHERE u.id = :id")
    Optional<User> findByIdWithRelations(UUID id);

    /**
     * Tìm người dùng theo username với JOIN FETCH.
     */
    @Query("SELECT u FROM User u "
            + "LEFT JOIN FETCH u.orgUnit "
            + "LEFT JOIN FETCH u.groups "
            + "LEFT JOIN FETCH u.roles "
            + "WHERE u.username = :username")
    Optional<User> findByUsernameWithRelations(String username);

    /**
     * Đếm số lượng người dùng hoạt động (chưa xóa) có vai trò này.
     */
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.id = :roleId AND u.status <> UserStatus.DELETED")
    long countByRoleId(@org.springframework.data.repository.query.Param("roleId") UUID roleId);

    /**
     * Lấy id của tất cả người dùng đang giữ một vai trò (dùng để invalidate cache
     * quyền khi permission của vai trò đó thay đổi).
     */
    @Query("SELECT u.id FROM User u JOIN u.roles r WHERE r.id = :roleId")
    List<UUID> findIdsByRoleId(@org.springframework.data.repository.query.Param("roleId") UUID roleId);

    /**
     * Thống kê số lượng người dùng hoạt động theo từng vai trò (tránh N+1 query).
     */
    @Query("SELECT r.id, COUNT(u) FROM User u JOIN u.roles r WHERE u.status <> UserStatus.DELETED GROUP BY r.id")
    List<Object[]> countUsersGroupByRoleId();

    @Query("SELECT DISTINCT u FROM User u " +
           "LEFT JOIN u.roles r " +
           "WHERE (:search IS NULL OR :search = '' OR " +
           "  LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "  LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "  LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:roleCode IS NULL OR :roleCode = '' OR r.code = :roleCode) " +
           "AND (:status IS NULL OR u.status = :status)")
    org.springframework.data.domain.Page<User> searchUsers(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("roleCode") String roleCode,
            @org.springframework.data.repository.query.Param("status") UserStatus status,
            org.springframework.data.domain.Pageable pageable);
}
