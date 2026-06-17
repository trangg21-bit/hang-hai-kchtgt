package com.hanghai.kchtg.admin.repository;

import com.hanghai.kchtg.admin.entity.AdminPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity {@link AdminPermission}.
 */
@Repository
public interface AdminPermissionRepository extends JpaRepository<AdminPermission, UUID> {

    /**
     * T́m t?t c? permissions c?a m?t admin.
     */
    List<AdminPermission> findByAdminId(UUID adminId);

    /**
     * T́m t?t c? permissions c?a m?t admin cho m?t module c? th?.
     */
    List<AdminPermission> findByAdminIdAndModuleId(UUID adminId, String moduleId);

    /**
     * Ki?m tra admin có permission c? th? trong module không.
     */
    @Query("SELECT COUNT(ap) > 0 FROM AdminPermission ap " +
           "WHERE ap.adminId = :adminId AND ap.moduleId = :moduleId AND :permission MEMBER OF ap.permissions")
    boolean hasPermission(@Param("adminId") UUID adminId,
                          @Param("moduleId") String moduleId,
                          @Param("permission") String permission);

    /**
     * Xóa t?t c? permissions c?a m?t admin.
     */
    void deleteByAdminId(UUID adminId);

    /**
     * Đ?m s? permissions c?a m?t admin.
     */
    long countByAdminId(UUID adminId);
}
