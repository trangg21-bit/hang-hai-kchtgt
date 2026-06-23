package com.hanghai.kchtg.group;

import com.hanghai.kchtg.group.dto.AddGroupMemberRequest;
import com.hanghai.kchtg.group.dto.CreateGroupRequest;
import com.hanghai.kchtg.group.dto.UpdateGroupRequest;
import com.hanghai.kchtg.group.entity.GroupHistory;
import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.GroupMemberStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.group.repository.GroupHistoryRepository;
import com.hanghai.kchtg.group.service.UserGroupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserGroupServiceTest {

    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMemberRepository memberRepository;
    @Mock
    private GroupHistoryRepository historyRepository;

    @InjectMocks
    private UserGroupService groupService;

    private UserGroup testGroup;
    private UUID operatorId;
    private String operatorName;

    @BeforeEach
    void setUp() {
        testGroup = new UserGroup();
        testGroup.setId(UUID.randomUUID());
        testGroup.setName("Maritime Operations");
        testGroup.setCode("OPS");
        testGroup.setDescription("Operations team");
        testGroup.setStatus(GroupStatus.ACTIVE);
        testGroup.setPermissions(List.of("user.view", "user.create"));

        operatorId = UUID.randomUUID();
        operatorName = "system_admin";
    }

    @Nested
    @DisplayName("Create Group")
    class CreateTests {

        @Test
        @DisplayName("Should create group successfully")
        void createGroup_success() {
            CreateGroupRequest request = new CreateGroupRequest();
            request.setName("Team Beta");
            request.setCode("TEAM-BETA");
            request.setDescription("Beta team");
            request.setPermissions(List.of("user.view"));

            when(groupRepository.existsByCode("TEAM-BETA")).thenReturn(false);
            when(groupRepository.save(any(UserGroup.class))).thenAnswer(inv -> {
                UserGroup g = inv.getArgument(0);
                g.setId(UUID.randomUUID());
                return g;
            });
            when(historyRepository.save(any(GroupHistory.class))).thenReturn(new GroupHistory());

            UserGroup created = groupService.create(request, operatorId, operatorName);

            assertNotNull(created);
            assertEquals("Team Beta", created.getName());
            assertEquals("TEAM-BETA", created.getCode());
            verify(groupRepository).save(any(UserGroup.class));
            verify(historyRepository).save(any(GroupHistory.class));
        }

        @Test
        @DisplayName("Should throw when group code already exists")
        void createDuplicateCode_throwsException() {
            CreateGroupRequest request = new CreateGroupRequest();
            request.setName("Maritime Ops");
            request.setCode("OPS");

            when(groupRepository.existsByCode("OPS")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () ->
                    groupService.create(request, operatorId, operatorName));
        }
    }

    @Nested
    @DisplayName("Read Groups")
    class ReadTests {

        @Test
        @DisplayName("Should find group by ID")
        void findById_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));

            UserGroup result = groupService.findById(testGroup.getId());
            assertNotNull(result);
            assertEquals(testGroup.getId(), result.getId());
        }

        @Test
        @DisplayName("Should return all groups")
        void findAll_success() {
            when(groupRepository.findAll()).thenReturn(List.of(testGroup));

            assertEquals(1, groupService.findAll().size());
        }

        @Test
        @DisplayName("Should find group by code")
        void findByCode_success() {
            when(groupRepository.findByCode("OPS")).thenReturn(Optional.of(testGroup));

            UserGroup result = groupService.findByCode("OPS");
            assertNotNull(result);
            assertEquals("OPS", result.getCode());
        }
    }

    @Nested
    @DisplayName("Update Group")
    class UpdateTests {

        @Test
        @DisplayName("Should update group details")
        void updateGroup_success() {
            UpdateGroupRequest request = new UpdateGroupRequest();
            request.setName("New Name");
            request.setDescription("New Desc");
            request.setPermissions(List.of("user.view"));

            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupRepository.save(any(UserGroup.class))).thenAnswer(inv -> inv.getArgument(0));
            when(historyRepository.save(any(GroupHistory.class))).thenReturn(new GroupHistory());

            UserGroup updated = groupService.update(testGroup.getId(), request, operatorId, operatorName);

            assertNotNull(updated);
            assertEquals("New Name", updated.getName());
            verify(groupRepository).save(any(UserGroup.class));
            verify(historyRepository).save(any(GroupHistory.class));
        }
    }

    @Nested
    @DisplayName("Delete Group")
    class DeleteTests {

        @Test
        @DisplayName("Should delete group (soft delete)")
        void deleteGroup_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupRepository.save(any(UserGroup.class))).thenAnswer(inv -> inv.getArgument(0));
            when(historyRepository.save(any(GroupHistory.class))).thenReturn(new GroupHistory());

            groupService.delete(testGroup.getId(), operatorId, operatorName);

            verify(groupRepository).save(any(UserGroup.class));
            verify(historyRepository).save(any(GroupHistory.class));
        }
    }

    @Nested
    @DisplayName("Group Membership")
    class MembershipTests {

        @Test
        @DisplayName("Should add user to group")
        void addMember_success() {
            UUID userId = UUID.randomUUID();
            AddGroupMemberRequest request = new AddGroupMemberRequest();
            request.setUserId(userId);
            request.setRole("MEMBER");

            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(memberRepository.findByUserIdAndUserGroupId(userId, testGroup.getId())).thenReturn(Optional.empty());
            when(memberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));
            when(historyRepository.save(any(GroupHistory.class))).thenReturn(new GroupHistory());

            GroupMember member = groupService.addMember(testGroup.getId(), request, operatorId);

            assertNotNull(member);
            verify(memberRepository).save(any(GroupMember.class));
            verify(historyRepository).save(any(GroupHistory.class));
        }

        @Test
        @DisplayName("Should remove user from group")
        void removeMember_success() {
            UUID memberId = UUID.randomUUID();
            GroupMember member = new GroupMember();
            member.setId(memberId);
            member.setUserGroup(testGroup);

            when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
            when(memberRepository.save(any(GroupMember.class))).thenReturn(member);
            when(historyRepository.save(any(GroupHistory.class))).thenReturn(new GroupHistory());

            assertDoesNotThrow(() -> groupService.removeMember(memberId, operatorId, operatorName));
            assertEquals(GroupMemberStatus.REMOVED, member.getStatus());
            verify(memberRepository).save(member);
            verify(historyRepository).save(any(GroupHistory.class));
        }

        @Test
        @DisplayName("Should find active members of group")
        void findMembers_success() {
            GroupMember member = new GroupMember();
            member.setUserGroup(testGroup);
            member.setStatus(GroupMemberStatus.ACTIVE);

            when(memberRepository.findByGroupId(testGroup.getId(), GroupMemberStatus.ACTIVE))
                    .thenReturn(List.of(member));

            List<GroupMember> members = groupService.findMembers(testGroup.getId());
            assertEquals(1, members.size());
            verify(memberRepository).findByGroupId(testGroup.getId(), GroupMemberStatus.ACTIVE);
        }
    }
}
