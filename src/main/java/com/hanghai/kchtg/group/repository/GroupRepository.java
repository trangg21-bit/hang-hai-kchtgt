package com.hanghai.kchtg.group.repository;

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
 * M-001 F-002: Added pagination, search, filter (groupType, status, myGroups),
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
     * Kiem tra ten nhom da ton tai chua (BR-008).
     */
    boolean existsByName(String name);

    /**
     * Kiem tra ten nhom da ton tai (ngoai tru mot nhom cu the).
     */
    boolean existsByNameAndIdNot(String name, UUID id);

    /**
     * Tim kiem nhom theo ten (LIKE), co phan trang.
     */
    @Query("SELECT g FROM UserGroup g WHERE g.name LIKE %:search%")
    Page<UserGroup> searchByName(@Param("search") String search, Pageable pageable);

    /**
     * Loc theo loai nhom (BR-012), co phan trang.
     */
    @Query("SELECT g FROM UserGroup g WHERE g.groupType = :groupType")
    Page<UserGroup> findByGroupType(@Param("groupType") String groupType, Pageable pageable);

    /**
     * Loc theo status, co phan trang.
     */
    Page<UserGroup> findByStatus(Pageable pageable, org.springframework.data.jpa.repository.QueryHints hints);

    /**
     * Loc theo status, co phan trang (thuan thong thuong).
     */
    @Query("SELECT g FROM UserGroup g WHERE g.status = :status")
    Page<UserGroup> findByStatus(@Param("status") String status, Pageable pageable);

    /**
     * Loc theo loai nhom + ten tim kiem, co phan trang.
     */
    @Query("SELECT g FROM UserGroup g "
          + "WHERE (:groupType IS NULL OR g.groupType = :groupType) "
          + "AND (:search IS NULL OR g.name LIKE %:search%) "
          + "AND (:status IS NULL OR g.status = :status)")
    Page<UserGroup> searchAndFilter(@Param("search") String search,
                                    @Param("groupType") String groupType,
                                    @Param("status") String status,
                                    Pageable pageable);

    /**
     * Loc theo loai nhom + tim kiem + my groups (user belongs to this group).
     * My groups filter: join group_members where userId = :userId.
     */
    @Query("SELECT DISTINCT g FROM UserGroup g "
          + "JOIN g.permissions p "
          + "WHERE (:userId IS NULL OR EXISTS ("
          + "  SELECT 1 FROM GroupMember gm WHERE gm.userGroup.id = g.id "
          + "  AND gm.user.id = :userId AND gm.status = 'ACTIVE')) "
          + "AND (:groupType IS NULL OR g.groupType = :groupType) "
          + "AND (:search IS NULL OR g.name LIKE %:search%)")
    Page<UserGroup> searchAndFilterMyGroups(@Param("search") String search,
                                            @Param("groupType") String groupType,
                                            @Param("userId") UUID userId,
                                            Pageable pageable);

    /**
     * Dem so nhom.
     */
    long count();

    /**
     * Dem so nhom theo loai.
     */
    long countByGroupType(String groupType);

    /**
     * Tim tat ca nhom (active).
     */
    List<UserGroup> findByStatus(String status);

    /**
     * Tim kiem theo ten.
     */
    List<UserGroup> findByNameContaining(String name);
}
