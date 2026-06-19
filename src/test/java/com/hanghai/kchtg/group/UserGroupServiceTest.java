package com.hanghai.kchtg.group;

import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.GroupMemberStatus;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.group.repository.GroupHistoryRepository;
import com.hanghai.kchtg.group.service.UserGroupService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
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
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserGroupService groupService;

    private UserGroup testGroup;
    private User testUser;

    @BeforeEach
    void setUp() {
        testGroup = new UserGroup();
        testGroup.setId(UUID.randomUUID());
        testGroup.setName("Maritime Operations");
        testGroup.setCode("OPS");
        testGroup.setDescription("Operations team");
        testGroup.setGroupType("ops");
        testGroup.setIsActive(true);
        testGroup.setStatus(GroupStatus.ACTIVE);
        testGroup.setPermissions(List.of("user.view", "user.create"));

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("captain");
        testUser.setUsername("captain");
    }

    @Nested
    @DisplayName("Create Group")
    class CreateTests {

        @Test
        @DisplayName("Should create group successfully")
        void createGroup_success() {
            when(groupRepository.existsByCode("TEAM-BETA")).thenReturn(false);
            when(groupRepository.save(any(UserGroup.class))).thenAnswer(inv -> {
                UserGroup g = inv.getArgument(0);
                g.setId(UUID.randomUUID());
                return g;
            });

            UserGroup created = groupService.createGroup("Team Beta", "TEAM-BETA", "Beta team", "ops");

            assertNotNull(created);
            assertEquals("Team Beta", created.getName());
            verify(groupRepository).save(any(UserGroup.class));
        }

        @Test
        @DisplayName("Should throw when group code already exists")
        void createDuplicateCode_throwsException() {
            when(groupRepository.existsByCode("OPS")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () ->
                    groupService.createGroup("Maritime Ops", "OPS", "Desc", "ops"));
        }
    }

    @Nested
    @DisplayName("Read Groups")
    class ReadTests {

        @Test
        @DisplayName("Should find group by ID")
        void findById_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));

            assertTrue(groupService.findById(testGroup.getId()).isPresent());
        }

        @Test
        @DisplayName("Should return all groups")
        void findAll_success() {
            when(groupRepository.findAll()).thenReturn(Arrays.asList(testGroup));

            assertEquals(1, groupService.findAll().size());
        }

        @Test
        @DisplayName("Should find group by code")
        void findByCode_success() {
            when(groupRepository.findByCode("OPS")).thenReturn(Optional.of(testGroup));

            Optional<UserGroup> result = groupService.findByCode("OPS");
            assertTrue(result.isPresent());
            assertEquals("OPS", result.get().getCode());
        }

        @Test
        @DisplayName("Should return active groups")
        void findActiveGroups_success() {
            when(groupRepository.findAll()).thenReturn(Arrays.asList(testGroup));

            List<UserGroup> result = groupService.findActiveGroups();
            assertTrue(result.stream().allMatch(g -> g.getStatus() == GroupStatus.ACTIVE));
        }
    }

    @Nested
    @DisplayName("Update Group")
    class UpdateTests {

        @Test
        @DisplayName("Should update group details")
        void updateGroup_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupRepository.save(any(UserGroup.class))).thenAnswer(inv -> inv.getArgument(0));

            UserGroup updated = groupService.updateGroup(testGroup.getId(),
                    "New Name", "New Desc", "New-Code");

            assertNotNull(updated);
            verify(groupRepository).save(any(UserGroup.class));
        }
    }

    @Nested
    @DisplayName("Group Membership")
    class MembershipTests {

        @Test
        @DisplayName("Should add user to group")
        void addMember_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(memberRepository.existsByGroupIdAndUserId(testGroup.getId(), testUser.getId())).thenReturn(false);
            when(memberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));

            groupService.addMember(testGroup.getId(), testUser.getId());

            verify(memberRepository).save(any(GroupMember.class));
        }

        @Test
        @DisplayName("Should remove user from group")
        void removeMember_success() {
            when(memberRepository.findByGroupIdAndUserId(testGroup.getId(), testUser.getId()))
                    .thenReturn(Optional.of(new GroupMember()));
            when(memberRepository.delete(any(GroupMember.class))).thenReturn(null);

            assertDoesNotThrow(() -> groupService.removeMember(testGroup.getId(), testUser.getId()));
        }

        @Test
        @DisplayName("Should check if user is group member")
        void isMember_true() {
            when(memberRepository.existsByGroupIdAndUserId(testGroup.getId(), testUser.getId()))
                    .thenReturn(true);

            assertTrue(groupService.isMember(testGroup.getId(), testUser.getId()));
        }

        @Test
        @DisplayName("Should return false if user is not a member")
        void isMember_false() {
            when(memberRepository.existsByGroupIdAndUserId(testGroup.getId(), testUser.getId()))
                    .thenReturn(false);

            assertFalse(groupService.isMember(testGroup.getId(), testUser.getId()));
        }
    }

    @Nested
    @DisplayName("Toggle Active")
    class ToggleActiveTests {

        @Test
        @DisplayName("Should toggle group active status")
        void toggleActive_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupRepository.save(any(UserGroup.class))).thenAnswer(inv -> inv.getArgument(0));

            UserGroup toggled = groupService.toggleActive(testGroup.getId());
            assertNotNull(toggled);
        }
    }
}
