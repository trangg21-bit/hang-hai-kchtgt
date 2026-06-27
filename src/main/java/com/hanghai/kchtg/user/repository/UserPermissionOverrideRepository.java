package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserPermissionOverrideRepository extends JpaRepository<UserPermissionOverride, UUID> {
    List<UserPermissionOverride> findByUserId(UUID userId);
    List<UserPermissionOverride> findByUser_Username(String username);
}
