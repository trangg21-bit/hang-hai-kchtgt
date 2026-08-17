package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link UserGroup}.
 * <p>
 * M-001 F-002: Added pagination, search, filter (organization, status, myGroups),
 * uniqueness checks, and member count queries.
 * </p>
 */
public interface GroupRepository extends JpaRepository<UserGroup, UUID> {

    /**
     * Tim nhom theo ma code (unique).
     */
    Optional<UserGroup> findByCode(String code);

    /**
     * Kiem tra xem ma code da ton tai chua.
     */
    boolean existsByCode(String code);

    /**
     * Kiem tra xem ma code da ton tai va chua bi xoa mem chua.
     */
    boolean existsByCodeAndDeletedAtIsNull(String code);

    /**
     * Kiem tra ten nhom da ton tai chua (BR-008).
     */
    boolean existsByNameAndDeletedAtIsNull(String name);

    /**
     * Kiem tra ten nhom da ton tai (ngoai tru mot nhom cu the).
     */
    boolean existsByNameAndIdNotAndDeletedAtIsNull(String name, UUID id);

    /**
     * Tim kiem nhom theo ten (LIKE), co phan trang.
     */
    @Query("SELECT g FROM UserGroup g WHERE g.name LIKE %:search%")
    Page<UserGroup> searchByName(@Param("search") String search, Pageable pageable);

    /**
     * Loc theo status, co phan trang.
     */
    Page<UserGroup> findByStatus(Pageable pageable, org.springframework.data.jpa.repository.QueryHints hints);

    /**
     * Loc theo status, co phan trang (thuan thong thuong).
     */
    @Query("SELECT g FROM UserGroup g WHERE g.status = :status")
    Page<UserGroup> findByStatus(@Param("status") GroupStatus status, Pageable pageable);

    /**
     * Loc theo loai nhom + ten tim kiem, co phan trang.
     */
    @Query("SELECT g FROM UserGroup g "
          + "WHERE g.deletedAt IS NULL "
          + "AND (:unrestricted = true OR g.organizationId IN :organizationIds) "
          + "AND (:search IS NULL OR :search = '' OR "
          + "     cast(function('translate', LOWER(COALESCE(g.name, '')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string) LIKE cast(function('translate', LOWER(CONCAT('%', :search, '%')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string)) "
          + "AND (:code IS NULL OR :code = '' OR "
          + "     cast(function('translate', LOWER(COALESCE(g.code, '')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string) LIKE cast(function('translate', LOWER(CONCAT('%', :code, '%')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string)) "
          + "AND (:status IS NULL OR cast(g.status as integer) = :status)")
    Page<UserGroup> searchAndFilter(@Param("search") String search,
                                    @Param("code") String code,
                                    @Param("status") Integer status,
                                    @Param("unrestricted") boolean unrestricted,
                                    @Param("organizationIds") List<UUID> organizationIds,
                                    Pageable pageable);

    @Query("SELECT COUNT(g) FROM UserGroup g "
          + "WHERE g.deletedAt IS NULL "
          + "AND (:unrestricted = true OR g.organizationId IN :organizationIds) "
          + "AND (:search IS NULL OR :search = '' OR "
          + "     cast(function('translate', LOWER(COALESCE(g.name, '')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string) LIKE cast(function('translate', LOWER(CONCAT('%', :search, '%')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string)) "
          + "AND (:code IS NULL OR :code = '' OR "
          + "     cast(function('translate', LOWER(COALESCE(g.code, '')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string) LIKE cast(function('translate', LOWER(CONCAT('%', :code, '%')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string)) "
          + "AND cast(g.status as integer) = :status")
    long countByFiltersAndStatus(@Param("search") String search,
                                 @Param("code") String code,
                                 @Param("unrestricted") boolean unrestricted,
                                 @Param("organizationIds") List<UUID> organizationIds,
                                 @Param("status") Integer status);

    /**
     * Loc theo tim kiem + my groups (user belongs to this group).
     * My groups filter: join group_members where userId = :userId.
     */
    @Query("SELECT DISTINCT g FROM UserGroup g "
          + "LEFT JOIN g.permissions p "
          + "WHERE g.deletedAt IS NULL "
          + "AND (:userId IS NULL OR EXISTS ("
          + "  SELECT 1 FROM GroupMember gm WHERE gm.userGroup.id = g.id "
          + "  AND gm.user.id = :userId AND gm.status = GroupMemberStatus.ACTIVE)) "
          + "AND (:status IS NULL OR cast(g.status as integer) = :status) "
          + "AND (:unrestricted = true OR g.organizationId IN :organizationIds) "
          + "AND (:search IS NULL OR :search = '' OR "
          + "     cast(function('translate', LOWER(COALESCE(g.name, '')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string) LIKE cast(function('translate', LOWER(CONCAT('%', :search, '%')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string)) "
          + "AND (:code IS NULL OR :code = '' OR "
          + "     cast(function('translate', LOWER(COALESCE(g.code, '')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string) LIKE cast(function('translate', LOWER(CONCAT('%', :code, '%')), 'àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd') as string))")
    Page<UserGroup> searchAndFilterMyGroups(@Param("search") String search,
                                            @Param("code") String code,
                                            @Param("status") Integer status,
                                            @Param("userId") UUID userId,
                                            @Param("unrestricted") boolean unrestricted,
                                            @Param("organizationIds") List<UUID> organizationIds,
                                            Pageable pageable);

    /**
     * Dem so nhom.
     */
    long count();

    /**
     * Tim tat ca nhom (active).
     */
    List<UserGroup> findByStatus(GroupStatus status);

    /**
     * Tim kiem theo ten.
     */
    List<UserGroup> findByNameContaining(String name);
}
