package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link Role}.
 */
public interface RoleRepository extends JpaRepository<Role, UUID> {

    /**
     * Tìm role theo mã code duy nhất.
     */
    Optional<Role> findByCode(String code);

    /**
     * Kiểm tra tồn tại theo code.
     */
    boolean existsByCode(String code);

    /**
     * Tìm tất cả role đang hoạt động.
     */
    List<Role> findByStatus(RoleStatus status);

    /**
     * Tìm tất cả các role có trạng thái khác trạng thái truyền vào (dùng để bỏ qua DELETED).
     */
    List<Role> findByStatusNot(RoleStatus status);

    /**
     * Tìm tất cả các role có trạng thái khác trạng thái truyền vào có phân trang.
     */
    org.springframework.data.domain.Page<Role> findByStatusNot(RoleStatus status, org.springframework.data.domain.Pageable pageable);

    /**
     * Tìm role có chứa permission cụ thể.
     */
    @Query("SELECT r FROM Role r WHERE :permission MEMBER OF r.permissions")
    List<Role> findByPermissionsContaining(@Param("permission") String permission);

    /**
     * Kiểm tra code có tồn tại ngoài ID này (dùng khi update).
     */
    boolean existsByCodeAndIdNot(String code, UUID id);
}