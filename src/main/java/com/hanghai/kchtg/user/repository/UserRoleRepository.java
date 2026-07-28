package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for {@link UserRole} tracking (F-275 3-Level RBAC).
 */
@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    /** Find all role assignments for a user. */
    List<UserRole> findByUserId(UUID userId);

    /** Find all users assigned a given role. */
    List<UserRole> findByRoleId(UUID roleId);

    /** Find directly-granted roles for a user. */
    List<UserRole> findByUserIdAndIsDirectGrant(UUID userId, Boolean isDirectGrant);

    /** Find a specific user-role assignment. */
    Optional<UserRole> findByUserIdAndRoleId(UUID userId, UUID roleId);

    /** Remove a specific user-role assignment. */
    void deleteByUserIdAndRoleId(UUID userId, UUID roleId);
}
