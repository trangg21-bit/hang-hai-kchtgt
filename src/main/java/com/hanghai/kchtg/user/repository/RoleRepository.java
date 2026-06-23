package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.RoleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
     * TĂ¬m role theo mĂ£ code duy nháº¥t.
     */
    Optional<Role> findByCode(String code);

    /**
     * Kiá»ƒm tra tá»“n táº¡i theo code.
     */
    boolean existsByCode(String code);

    /**
     * TĂ¬m táº¥t cáº£ role Ä‘ang hoáº¡t Ä‘á»™ng.
     */
    List<Role> findByStatus(RoleStatus status);

    /**
     * Tìm role có chứa permission cụ thể.
     */
    @Query("SELECT r FROM Role r WHERE :permission MEMBER OF r.permissions")
    List<Role> findByPermissionsContaining(@Param("permission") String permission);

    /**
     * Kiá»ƒm tra code cĂ³ tá»“n táº¡i ngoĂ i ID nĂ y (dĂ¹ng khi update).
     */
    boolean existsByCodeAndIdNot(String code, UUID id);
}
