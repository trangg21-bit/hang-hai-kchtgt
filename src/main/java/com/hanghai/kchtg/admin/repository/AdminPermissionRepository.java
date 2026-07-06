package com.hanghai.kchtg.admin.repository;

import com.hanghai.kchtg.admin.entity.AdminPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link AdminPermission}.
 */
public interface AdminPermissionRepository extends JpaRepository<AdminPermission, UUID> {

    /**
     * T́m tất cả permissions của một admin.
     */
    List<AdminPermission> findByAdminId(UUID adminId);

    /**
     * T́m tất cả permissions của một admin cho một module cụ thể.
     */
    List<AdminPermission> findByAdminIdAndModuleId(UUID adminId, String moduleId);

    /**
     * Kiểm tra admin có permission cụ thể trong module không.
     */
    @Query("SELECT COUNT(ap) > 0 FROM AdminPermission ap " +
           "WHERE ap.adminId = :adminId AND ap.moduleId = :moduleId AND :permission MEMBER OF ap.permissions")
    boolean hasPermission(@Param("adminId") UUID adminId,
                          @Param("moduleId") String moduleId,
                          @Param("permission") String permission);

    /**
     * Xóa tất cả permissions của một admin.
     */
    void deleteByAdminId(UUID adminId);

    /**
     * Đếm số permissions của một admin.
     */
    long countByAdminId(UUID adminId);
}