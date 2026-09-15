package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPermissionOverrideRepository extends JpaRepository<UserPermissionOverride, UUID> {
    List<UserPermissionOverride> findByUserId(UUID userId);

    /**
     * Chỉ trả các quyền trực tiếp đang hoạt động. Không để bản ghi đã thu hồi
     * xuất hiện lại khi mở popup phân quyền lần tiếp theo.
     */
    @Query("SELECT o FROM UserPermissionOverride o WHERE o.user.id = :userId AND o.deletedAt IS NULL")
    List<UserPermissionOverride> findActiveByUserId(@Param("userId") UUID userId);

    @Query("SELECT o FROM UserPermissionOverride o WHERE o.user.id = :userId AND LOWER(o.permissionCode) = LOWER(:permissionCode) AND o.deletedAt IS NULL ORDER BY o.updatedAt DESC NULLS LAST, o.createdAt DESC")
    List<UserPermissionOverride> findActiveByUserIdAndPermissionCode(@Param("userId") UUID userId, @Param("permissionCode") String permissionCode);

    @Query("SELECT o FROM UserPermissionOverride o WHERE o.user.id = :userId AND LOWER(o.permissionCode) = LOWER(:permissionCode) ORDER BY o.deletedAt NULLS FIRST, o.updatedAt DESC NULLS LAST, o.createdAt DESC")
    List<UserPermissionOverride> findAllByUserIdAndPermissionCode(@Param("userId") UUID userId, @Param("permissionCode") String permissionCode);

    default Optional<UserPermissionOverride> findByUserIdAndPermissionCode(UUID userId, String permissionCode) {
        List<UserPermissionOverride> list = findAllByUserIdAndPermissionCode(userId, permissionCode);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    List<UserPermissionOverride> findByUser_Username(String username);
}
