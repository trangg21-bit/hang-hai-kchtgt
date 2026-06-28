package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.GroupMemberStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link GroupMember}.
 */
public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {

    /**
     * Dem so thanh vien active cua mot nhom (BR-009).
     */
    long countByUserGroupIdAndStatus(UUID groupId, GroupMemberStatus status);

    /**
     * Kiem tra membership da ton tai chua (BR-010).
     */
    boolean existsByUserIdAndUserGroupIdAndStatus(UUID userId, UUID groupId, GroupMemberStatus status);

    /**
     * Tim membership cua mot nguoi dung trong mot nhom cu the (active).
     */
    Optional<GroupMember> findByUserIdAndUserGroupIdAndStatus(UUID userId, UUID groupId, GroupMemberStatus status);

    /**
     * Liet ke thanh vien cua nhom (active), phan trang.
     */
    @Query("SELECT gm FROM GroupMember gm "
          + "WHERE gm.userGroup.id = :groupId AND gm.status = :status")
    Page<GroupMember> findByGroupId(@Param("groupId") UUID groupId,
                                    @Param("status") GroupMemberStatus status,
                                    Pageable pageable);

    /**
     * Liet ke tat ca members cua mot nhom (active), LEFT JOIN FETCH user.
     */
    @Query("SELECT DISTINCT gm FROM GroupMember gm "
          + "LEFT JOIN FETCH gm.user "
          + "WHERE gm.userGroup.id = :groupId AND gm.status = :status")
    Page<GroupMember> findByGroupIdWithUser(@Param("groupId") UUID groupId,
                                            @Param("status") GroupMemberStatus status,
                                            Pageable pageable);

    /**
     * Liet ke thanh vien active cua mot nguoi dung (my groups filter).
     */
    @Query("SELECT gm FROM GroupMember gm "
          + "LEFT JOIN FETCH gm.userGroup "
          + "WHERE gm.user.id = :userId AND gm.status = :status")
    Page<GroupMember> findByUserId(@Param("userId") UUID userId,
                                   @Param("status") GroupMemberStatus status,
                                   Pageable pageable);

    /**
     * Xoa mem (soft delete — status=REMOVED) cho mot user trong mot nhom.
     */
    @Modifying
    @Query("UPDATE GroupMember gm SET gm.status = :removedStatus "
          + "WHERE gm.user.id = :userId AND gm.userGroup.id = :groupId AND gm.status = :activeStatus")
    int removeMember(@Param("userId") UUID userId,
                     @Param("groupId") UUID groupId,
                     @Param("activeStatus") GroupMemberStatus activeStatus,
                     @Param("removedStatus") GroupMemberStatus removedStatus);

    /**
     * Tim tat ca membership (khong filter status) cho membership list.
     */
    @Query("SELECT DISTINCT gm FROM GroupMember gm "
          + "LEFT JOIN FETCH gm.user "
          + "WHERE gm.userGroup.id = :groupId")
    Page<GroupMember> findAllByGroupIdWithUser(@Param("groupId") UUID groupId,
                                               Pageable pageable);
}
