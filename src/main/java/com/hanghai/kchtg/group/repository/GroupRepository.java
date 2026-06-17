package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository cho {@link UserGroup}.
 */
@Repository
public interface GroupRepository extends JpaRepository<UserGroup, UUID> {

    /**
     * TĂ¬m nhĂ³m theo mĂ£ code (unique).
     */
    Optional<UserGroup> findByCode(String code);

    /**
     * Kiá»ƒm tra xem mĂ£ code Ä‘Ă£ tá»“n táº¡i chÆ°a.
     */
    boolean existsByCode(String code);
}
