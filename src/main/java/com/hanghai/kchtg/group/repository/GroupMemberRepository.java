package com.hanghai.kchtg.group.repository;

import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.GroupMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho entity {@link GroupMember}.
 */
@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {

    /**
     * Tim tat ca members cua mot nhom voi trang thai ACTIVE.
     */
    @Query("SELECT gm FROM GroupMember gm "
         + "LEFT JOIN FETCH gm.user u "
         + "LEFT JOIN FETCH gm.userGroup "
         + "WHERE gm.userGroup.id = :groupId AND gm.status = :status")
    List<GroupMember> findByGroupId(@Param("groupId") UUID groupId, @Param("status") GroupMemberStatus status);

    /**
     * Tim membership cua mot nguoi dung trong mot nhom cu the.
     */
    Optional<GroupMember> findByUserIdAndUserGroupId(UUID userId, UUID userGroupId);

    /**
     * Tim tat ca groups ma mot nguoi dung la member.
     */
    @Query("SELECT gm FROM GroupMember gm "
         + "LEFT JOIN FETCH gm.userGroup "
         + "WHERE gm.user.id = :userId AND gm.status = :status")
    List<GroupMember> findByUserId(@Param("userId") UUID userId, @Param("status") GroupMemberStatus status);

    /**
     * Dem so thanh vien active cua mot nhom.
     */
    long countByUserGroupIdAndStatus(UUID groupId, GroupMemberStatus status);

    /**
     * Tim tat ca members cua nhom (khong filter status).
     */
    @Query("SELECT gm FROM GroupMember gm "
         + "LEFT JOIN FETCH gm.user "
         + "LEFT JOIN FETCH gm.userGroup "
         + "WHERE gm.userGroup.id = :groupId")
    List<GroupMember> findAllByGroupId(@Param("groupId") UUID groupId);

    /**
     * Tim members bi banned cua mot nhom.
     */
    List<GroupMember> findByUserGroupIdAndStatus(UUID groupId, GroupMemberStatus status);
}
