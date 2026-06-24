package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link Permission}.
 * <p>
 * Cung cấp các query tùy chỉnh cho việc tra cứu và lọc permission theo
 * code, resource (feature), và action (operation).
 * </p>
 */
public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    /**
     * Tìm permission theo mã code duy nhất.
     *
     * @param code mã permission theo định dạng {feature}:{action}
     * @return Optional chứa Permission hoặc rỗng
     */
    Optional<Permission> findByCode(String code);

    /**
     * Kiểm tra tồn tại permission theo code.
     *
     * @param code mã permission
     * @return true nếu tồn tại
     */
    boolean existsByCode(String code);

    /**
     * Kiểm tra tồn tại permission theo code, ngoại trừ ID này (dùng khi update).
     */
    boolean existsByCodeAndIdNot(String code, UUID id);

    /**
     * Tìm tất cả permission theo resource (feature).
     * Ví dụ: findAllByResource("manhien") -> [manhien:read, manhien:write, manhien:approve].
     */
    List<Permission> findByResource(String resource);

    /**
     * Tìm tất cả permission theo action (operation).
     * Ví dụ: findAllByAction("read") -> [manhien:read, baocao:read, ...].
     */
    List<Permission> findByAction(String action);

    /**
     * Tìm tất cả permission theo cả resource và action.
     */
    Optional<Permission> findByResourceAndAction(String resource, String action);

    /**
     * Tìm permission có chứa resource trong code (LIKE query).
     * Dành cho filter theo feature prefix.
     */
    @Query("SELECT p FROM Permission p WHERE p.resource = :resource")
    List<Permission> findByResourceExact(@Param("resource") String resource);

    /**
     * Đếm số permission theo resource.
     */
    long countByResource(String resource);

    /**
     * Xóa permission theo code (dùng khi Super Admin xóa).
     */
    void deleteByCode(String code);

    /**
     * Tìm tất cả permission còn tồn tại (chưa soft-delete, được BaseEntity tự xử lý).
     */
    @Override
    List<Permission> findAll();
}