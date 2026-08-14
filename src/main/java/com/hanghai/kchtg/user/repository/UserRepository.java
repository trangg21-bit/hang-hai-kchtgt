package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
            + "LEFT JOIN FETCH u.groups")
    List<User> findAllWithRelations();

    /**
     * Tìm danh sách người dùng theo danh sách ID kèm thông tin OrgUnit (tránh N+1 query khi hiển thị lịch sử).
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.orgUnit WHERE u.id IN :ids")
    List<User> findAllByIdInWithOrgUnit(@org.springframework.data.repository.query.Param("ids") java.util.Collection<UUID> ids);

    /**
     * Tìm người dùng theo ID với JOIN FETCH.
     */
    @Query("SELECT u FROM User u "
            + "LEFT JOIN FETCH u.orgUnit "
            + "LEFT JOIN FETCH u.groups "
            + "WHERE u.id = :id")
    Optional<User> findByIdWithRelations(UUID id);

    /**
     * Tìm người dùng theo username với JOIN FETCH.
     */
    @Query("SELECT u FROM User u "
            + "LEFT JOIN FETCH u.orgUnit "
            + "LEFT JOIN FETCH u.groups "
            + "WHERE u.username = :username")
    Optional<User> findByUsernameWithRelations(String username);

    @Query("SELECT u.status, COUNT(u) FROM User u " +
           "WHERE u.status <> com.hanghai.kchtg.user.entity.UserStatus.DELETED " +
           "AND (:search IS NULL OR :search = '' OR " +
           "CAST(function('immutable_unaccent', LOWER(u.email)) AS string) LIKE CAST(:search AS string) OR " +
           "CAST(function('immutable_unaccent', LOWER(u.username)) AS string) LIKE CAST(:search AS string)) " +
           "AND (:fullName IS NULL OR :fullName = '' OR " +
           "CAST(function('immutable_unaccent', LOWER(u.fullName)) AS string) LIKE CAST(:fullName AS string)) " +
           "AND u.deletedAt IS NULL " +
           "GROUP BY u.status")
    List<Object[]> countUsersByStatus(@Param("search") String search,
                                      @Param("fullName") String fullName);

    @Query("SELECT u.status, COUNT(u) FROM User u " +
           "WHERE u.status <> com.hanghai.kchtg.user.entity.UserStatus.DELETED " +
           "AND (:search IS NULL OR :search = '' OR " +
           "CAST(function('immutable_unaccent', LOWER(u.email)) AS string) LIKE CAST(:search AS string) OR " +
           "CAST(function('immutable_unaccent', LOWER(u.username)) AS string) LIKE CAST(:search AS string)) " +
           "AND (:fullName IS NULL OR :fullName = '' OR " +
           "CAST(function('immutable_unaccent', LOWER(u.fullName)) AS string) LIKE CAST(:fullName AS string)) " +
           "AND u.deletedAt IS NULL " +
           "AND u.orgUnit.id IN :orgUnitIds " +
           "GROUP BY u.status")
    List<Object[]> countUsersByStatusAndOrgUnits(@Param("search") String search,
                                                 @Param("fullName") String fullName,
                                                 @Param("orgUnitIds") java.util.Collection<UUID> orgUnitIds);

    @Query("SELECT DISTINCT u FROM User u " +
           "WHERE (:search IS NULL OR :search = '' OR " +
           "  CAST(function('immutable_unaccent', LOWER(u.email)) AS string) LIKE CAST(:search AS string) OR " +
           "  CAST(function('immutable_unaccent', LOWER(u.username)) AS string) LIKE CAST(:search AS string)) " +
           "AND (:fullName IS NULL OR :fullName = '' OR " +
           "  CAST(function('immutable_unaccent', LOWER(u.fullName)) AS string) LIKE CAST(:fullName AS string)) " +
           "AND u.deletedAt IS NULL " +
           "AND (:status IS NULL OR u.status = :status)")
    org.springframework.data.domain.Page<User> searchUsers(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("fullName") String fullName,
            @org.springframework.data.repository.query.Param("status") UserStatus status,
            org.springframework.data.domain.Pageable pageable);

    @Query(value = "SELECT u.id AS id, u.username AS username, u.email AS email, u.fullName AS fullName, " +
           "u.orgUnit.id AS orgUnitId, u.status AS status, u.lastLoginAt AS lastLoginAt " +
           "FROM User u " +
           "WHERE (:search IS NULL OR :search = '' OR " +
           "CAST(function('immutable_unaccent', LOWER(u.email)) AS string) LIKE CAST(:search AS string) OR " +
           "CAST(function('immutable_unaccent', LOWER(u.username)) AS string) LIKE CAST(:search AS string)) " +
           "AND (:fullName IS NULL OR :fullName = '' OR " +
           "CAST(function('immutable_unaccent', LOWER(u.fullName)) AS string) LIKE CAST(:fullName AS string)) " +
           "AND u.deletedAt IS NULL " +
           "AND (:status IS NULL OR u.status = :status)")
    List<UserListProjection> searchUserList(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("fullName") String fullName,
            @org.springframework.data.repository.query.Param("status") UserStatus status,
            org.springframework.data.domain.Pageable pageable);

    @Query(value = "SELECT u.id AS id, u.username AS username, u.email AS email, u.fullName AS fullName, " +
           "u.orgUnit.id AS orgUnitId, u.status AS status, u.lastLoginAt AS lastLoginAt " +
           "FROM User u " +
           "WHERE (:search IS NULL OR :search = '' OR " +
           "CAST(function('immutable_unaccent', LOWER(u.email)) AS string) LIKE CAST(:search AS string) OR " +
           "CAST(function('immutable_unaccent', LOWER(u.username)) AS string) LIKE CAST(:search AS string)) " +
           "AND (:fullName IS NULL OR :fullName = '' OR " +
           "CAST(function('immutable_unaccent', LOWER(u.fullName)) AS string) LIKE CAST(:fullName AS string)) " +
           "AND u.deletedAt IS NULL " +
           "AND (:status IS NULL OR u.status = :status) " +
           "AND u.orgUnit.id IN :orgUnitIds")
    List<UserListProjection> searchUserListByOrgUnits(
            @Param("search") String search,
            @Param("fullName") String fullName,
            @Param("status") UserStatus status,
            @Param("orgUnitIds") java.util.Collection<UUID> orgUnitIds,
            org.springframework.data.domain.Pageable pageable);
}
