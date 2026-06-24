package com.hanghai.kchtg.user.repository;
import com.hanghai.kchtg.user.entity.User;
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

    /**
     * Kiểm tra tồn tại tên đăng nhập.
     */
    boolean existsByUsername(String username);

    /**
     * Kiểm tra tồn tại email.
     */
    boolean existsByEmail(String email);

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
}