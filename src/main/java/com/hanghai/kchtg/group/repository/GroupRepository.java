package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.GroupType;
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
     * Loc theo loai nhom (BR-012), co phan trang.
     */
    @Query("SELECT g FROM UserGroup g WHERE g.groupType = :groupType")
    Page<UserGroup> findByGroupType(@Param("groupType") GroupType groupType, Pageable pageable);

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
          + "AND (:groupType IS NULL OR cast(g.groupType as integer) = :groupType) "
          + "AND (:search IS NULL OR g.name LIKE %:search%) "
          + "AND (:status IS NULL OR cast(g.status as integer) = :status)")
    Page<UserGroup> searchAndFilter(@Param("search") String search,
                                    @Param("groupType") Integer groupType,
                                    @Param("status") Integer status,
                                    Pageable pageable);

    @Query("SELECT COUNT(g) FROM UserGroup g "
          + "WHERE g.deletedAt IS NULL "
          + "AND (:groupType IS NULL OR cast(g.groupType as integer) = :groupType) "
          + "AND (:search IS NULL OR g.name LIKE %:search%) "
          + "AND cast(g.status as integer) = :status")
    long countByFiltersAndStatus(@Param("search") String search,
                                 @Param("groupType") Integer groupType,
                                 @Param("status") Integer status);

    /**
     * Loc theo loai nhom + tim kiem + my groups (user belongs to this group).
     * My groups filter: join group_members where userId = :userId.
     */
    @Query("SELECT DISTINCT g FROM UserGroup g "
          + "LEFT JOIN g.permissions p "
          + "WHERE g.deletedAt IS NULL "
          + "AND (:userId IS NULL OR EXISTS ("
          + "  SELECT 1 FROM GroupMember gm WHERE gm.userGroup.id = g.id "
          + "  AND gm.user.id = :userId AND gm.status = GroupMemberStatus.ACTIVE)) "
          + "AND (:groupType IS NULL OR cast(g.groupType as integer) = :groupType) "
          + "AND (:search IS NULL OR g.name LIKE %:search%)")
    Page<UserGroup> searchAndFilterMyGroups(@Param("search") String search,
                                            @Param("groupType") Integer groupType,
                                            @Param("userId") UUID userId,
                                            Pageable pageable);

    /**
     * Dem so nhom.
     */
    long count();

    /**
     * Dem so nhom theo loai.
     */
    long countByGroupType(GroupType groupType);

    /**
     * Tim tat ca nhom (active).
     */
    List<UserGroup> findByStatus(GroupStatus status);

    /**
     * Tim kiem theo ten.
     */
    List<UserGroup> findByNameContaining(String name);
}
