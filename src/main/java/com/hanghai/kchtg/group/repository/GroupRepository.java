package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository cho {@link UserGroup}.
 */
public interface GroupRepository extends JpaRepository<UserGroup, UUID> {

    /**
     * Tìm nhóm theo mã code (unique).
     */
    Optional<UserGroup> findByCode(String code);

    /**
     * Kiểm tra xem mã code đã tồn tại chưa.
     */
    boolean existsByCode(String code);
}