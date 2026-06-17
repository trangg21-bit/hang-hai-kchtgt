package com.hanghai.kchtg.group;

import com.hanghai.kchtg.group.model.UserGroup;
import com.hanghai.kchtg.group.repository.UserGroupRepository;
import com.hanghai.kchtg.group.service.UserGroupService;
import com.hanghai.kchtg.user.model.User;
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
    private UserGroupRepository groupRepository;

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
        testGroup.setDescription("Operations team");
        testGroup.setGroupType("ops");
        testGroup.setIsActive(true);

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("captain");
    }

    @Nested
    @DisplayName("Create Group")
    class CreateTests {

        @Test
        @DisplayName("Should create group successfully")
        void createGroup_success() {
            when(groupRepository.existsByName("Team Beta")).thenReturn(false);
            when(groupRepository.save(any(UserGroup.class))).thenReturn(testGroup);

            UserGroup created = groupService.createGroup("Team Beta", "Beta team", "ops");

            assertNotNull(created);
            assertEquals("Team Beta", created.getName());
        }

        @Test
        @DisplayName("Should throw when group name already exists")
        void createDuplicateName_throwsException() {
            when(groupRepository.existsByName("Maritime Ops")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () ->
                    groupService.createGroup("Maritime Ops", "Desc", "ops"));
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
        @DisplayName("Should filter by type")
        void findByType_success() {
            when(groupRepository.findByGroupType("ops")).thenReturn(Arrays.asList(testGroup));

            List<UserGroup> result = groupService.findByType("ops");
            assertEquals(1, result.size());
            assertEquals("ops", result.get(0).getGroupType());
        }

        @Test
        @DisplayName("Should return active groups")
        void findAllActive_success() {
            when(groupRepository.findByIsActive(true)).thenReturn(Arrays.asList(testGroup));

            List<UserGroup> result = groupService.findAllActive();
            assertTrue(result.stream().allMatch(UserGroup::getIsActive));
        }

        @Test
        @DisplayName("Should get group members")
        void getMembers_success() {
            when(groupRepository.getGroupMembers(testGroup.getId())).thenReturn(Arrays.asList(testUser));

            List<User> members = groupService.getMembers(testGroup.getId());
            assertEquals(1, members.size());
        }

        @Test
        @DisplayName("Should search groups by keyword")
        void search_success() {
            when(groupRepository.searchByKeyword("Maritime"))
                    .thenReturn(Arrays.asList(testGroup));

            assertEquals(1, groupService.search("Maritime").size());
        }

        @Test
        @DisplayName("Should check if user is group member")
        void isMember_true() {
            when(groupRepository.isMember(testGroup.getId(), testUser.getId()))
                    .thenReturn(true);

            assertTrue(groupService.isMember(testGroup.getId(), testUser.getId()));
        }

        @Test
        @DisplayName("Should return false if user is not a member")
        void isMember_false() {
            when(groupRepository.isMember(testGroup.getId(), testUser.getId()))
                    .thenReturn(false);

            assertFalse(groupService.isMember(testGroup.getId(), testUser.getId()));
        }
    }

    @Nested
    @DisplayName("Update Group")
    class UpdateTests {

        @Test
        @DisplayName("Should update group details")
        void updateGroup_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));

            UserGroup updated = groupService.updateGroup(testGroup.getId(),
                    "New Name", "New Desc", "admin");

            assertNotNull(updated);
            verify(groupRepository).save(any(UserGroup.class));
        }

        @Test
        @DisplayName("Should toggle group active status")
        void toggleActive_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));

            UserGroup updated = groupService.toggleActive(testGroup.getId());
            assertNotNull(updated);
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
            when(groupRepository.save(any(UserGroup.class))).thenReturn(testGroup);

            groupService.addMember(testGroup.getId(), testUser.getId());

            verify(groupRepository).save(any(UserGroup.class));
        }

        @Test
        @DisplayName("Should remove user from group")
        void removeMember_success() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupRepository.save(any(UserGroup.class))).thenReturn(testGroup);

            groupService.removeMember(testGroup.getId(), testUser.getId());

            verify(groupRepository).save(any(UserGroup.class));
        }

        @Test
        @DisplayName("Should batch add members to group")
        void addMembers_batch() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupRepository.save(any(UserGroup.class))).thenReturn(testGroup);

            List<UUID> userIds = Arrays.asList(UUID.randomUUID(), UUID.randomUUID());
            List<User> users = Arrays.asList(
                    createTestUser(UUID.randomUUID(), "user1"),
                    createTestUser(UUID.randomUUID(), "user2"));
            when(userRepository.findAllById(userIds)).thenReturn(users);

            groupService.addMembers(testGroup.getId(), userIds);

            verify(groupRepository).save(any(UserGroup.class));
        }

        private User createTestUser(UUID id, String username) {
            User u = new User();
            u.setId(id);
            u.setUsername(username);
            return u;
        }

        @Test
        @DisplayName("Should batch remove members from group")
        void removeMembers_batch() {
            when(groupRepository.findById(testGroup.getId())).thenReturn(Optional.of(testGroup));
            when(groupRepository.save(any(UserGroup.class))).thenReturn(testGroup);

            List<UUID> userIds = Arrays.asList(UUID.randomUUID(), UUID.randomUUID());

            groupService.removeMembers(testGroup.getId(), userIds);

            verify(groupRepository).save(any(UserGroup.class));
        }
    }
}
