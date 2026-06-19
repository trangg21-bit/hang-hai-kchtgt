package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link Role}.
 */
@Repository
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
     * Tìm role có chứa permission cụ thể.
     */
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM app_roles WHERE permissions LIKE %:permission%", nativeQuery = true)
    List<Role> findByPermissionsContaining(@org.springframework.data.repository.query.Param("permission") String permission);

    /**
     * Kiểm tra code có tồn tại ngoài ID này (dùng khi update).
     */
    boolean existsByCodeAndIdNot(String code, UUID id);
}
