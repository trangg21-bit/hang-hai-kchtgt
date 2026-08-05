package com.hanghai.kchtg.group.service;

import com.hanghai.kchtg.group.dto.AddGroupMemberRequest;
import com.hanghai.kchtg.group.dto.CreateUserGroupRequest;
import com.hanghai.kchtg.group.dto.GroupCopyRequest;
import com.hanghai.kchtg.group.dto.UpdateUserGroupRequest;
import com.hanghai.kchtg.group.entity.*;
import com.hanghai.kchtg.group.repository.GroupHistoryRepository;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserGroupServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @Mock
    private GroupHistoryRepository groupHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionCacheService permissionCacheService;

    @InjectMocks
    private UserGroupService userGroupService;

    private UUID groupId;
    private UUID operatorId;
    private UserGroup group;
    private User user;

    @BeforeEach
    void setUp() {
        groupId = UUID.randomUUID();
        operatorId = UUID.randomUUID();

        group = new UserGroup();
        group.setId(groupId);
        group.setName("Phòng Kế Hoạch");
        group.setCode("GRP_KEHOACH");
        group.setGroupType(GroupType.DEPARTMENT);
        group.setStatus(GroupStatus.ACTIVE);
        group.setPermissions(new ArrayList<>());

        user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");
        user.setGroups(new ArrayList<>());
    }

    @Test
    @DisplayName("create_shouldCreateGroupWhenNameAndCodeUnique")
    void create_shouldCreateGroupWhenNameAndCodeUnique() {
        CreateUserGroupRequest request = new CreateUserGroupRequest();
        request.setName("Phòng Kế Hoạch");
        request.setCode("GRP_KEHOACH");
        request.setGroupType(GroupType.DEPARTMENT);

        when(groupRepository.existsByNameAndDeletedAtIsNull("Phòng Kế Hoạch")).thenReturn(false);
        when(groupRepository.existsByCodeAndDeletedAtIsNull("GRP_KEHOACH")).thenReturn(false);
        when(groupRepository.save(any(UserGroup.class))).thenAnswer(inv -> {
            UserGroup g = inv.getArgument(0);
            g.setId(groupId);
            return g;
        });

        UserGroup result = userGroupService.create(request, operatorId, "Admin");

        assertNotNull(result);
        assertEquals("GRP_KEHOACH", result.getCode());
        assertEquals("Phòng Kế Hoạch", result.getName());
        verify(groupRepository).save(any(UserGroup.class));
        verify(groupHistoryRepository).save(any(GroupHistory.class));
    }

    @Test
    @DisplayName("create_shouldThrowWhenNameExists")
    void create_shouldThrowWhenNameExists() {
        CreateUserGroupRequest request = new CreateUserGroupRequest();
        request.setName("Phòng Kế Hoạch");
        request.setCode("GRP_KEHOACH");

        when(groupRepository.existsByNameAndDeletedAtIsNull("Phòng Kế Hoạch")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userGroupService.create(request, operatorId, "Admin"));

        assertTrue(ex.getMessage().contains("Tên nhóm đã tồn tại"));
        verify(groupRepository, never()).save(any(UserGroup.class));
    }

    @Test
    @DisplayName("create_shouldThrowWhenCodeExists")
    void create_shouldThrowWhenCodeExists() {
        CreateUserGroupRequest request = new CreateUserGroupRequest();
        request.setName("Phòng Mới");
        request.setCode("GRP_KEHOACH");

        when(groupRepository.existsByNameAndDeletedAtIsNull("Phòng Mới")).thenReturn(false);
        when(groupRepository.existsByCodeAndDeletedAtIsNull("GRP_KEHOACH")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userGroupService.create(request, operatorId, "Admin"));

        assertTrue(ex.getMessage().contains("Mã nhóm đã tồn tại"));
        verify(groupRepository, never()).save(any(UserGroup.class));
    }

    @Test
    @DisplayName("delete_shouldThrowWhenGroupHasActiveMembers")
    void delete_shouldThrowWhenGroupHasActiveMembers() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(groupMemberRepository.countByUserGroupIdAndStatus(groupId, GroupMemberStatus.ACTIVE)).thenReturn(3L);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> userGroupService.delete(groupId, operatorId, "Admin"));

        assertTrue(ex.getMessage().contains("Không thể xóa nhóm còn 3 thành viên"));
        verify(groupRepository, never()).save(any(UserGroup.class));
    }

    @Test
    @DisplayName("delete_shouldAllowDeleteWhenGroupHasNoMembers")
    void delete_shouldAllowDeleteWhenGroupHasNoMembers() {
        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(groupMemberRepository.countByUserGroupIdAndStatus(groupId, GroupMemberStatus.ACTIVE)).thenReturn(0L);

        assertDoesNotThrow(() -> userGroupService.delete(groupId, operatorId, "Admin"));

        verify(groupRepository).save(group);
        verify(groupHistoryRepository).save(any(GroupHistory.class));
    }

    @Test
    @DisplayName("addMember_shouldAddMemberAndInvalidateCache")
    void addMember_shouldAddMemberAndInvalidateCache() {
        AddGroupMemberRequest request = new AddGroupMemberRequest();
        request.setUserId(user.getId());

        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(groupMemberRepository.findByUserIdAndUserGroupId(user.getId(), groupId)).thenReturn(Optional.empty());
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));

        GroupMember result = userGroupService.addMember(groupId, request, operatorId, "Admin");

        assertNotNull(result);
        verify(permissionCacheService).invalidateAndIncrementVersion(user.getId());
        verify(groupHistoryRepository).save(any(GroupHistory.class));
    }

    @Test
    @DisplayName("addMember_shouldThrowWhenUserAlreadyInGroup")
    void addMember_shouldThrowWhenUserAlreadyInGroup() {
        AddGroupMemberRequest request = new AddGroupMemberRequest();
        request.setUserId(user.getId());

        GroupMember existingMember = new GroupMember();
        existingMember.setStatus(GroupMemberStatus.ACTIVE);

        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(groupMemberRepository.findByUserIdAndUserGroupId(user.getId(), groupId)).thenReturn(Optional.of(existingMember));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userGroupService.addMember(groupId, request, operatorId, "Admin"));

        assertTrue(ex.getMessage().contains("Người dùng đã thuộc nhóm này"));
        verify(permissionCacheService, never()).invalidateAndIncrementVersion(any());
    }

    @Test
    @DisplayName("copy_shouldCopyGroupAndMembers")
    void copy_shouldCopyGroupAndMembers() {
        GroupCopyRequest request = new GroupCopyRequest();
        request.setName("Phòng Kế Hoạch - Copy");

        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(groupRepository.save(any(UserGroup.class))).thenAnswer(inv -> {
            UserGroup g = inv.getArgument(0);
            if (g.getId() == null) g.setId(UUID.randomUUID());
            return g;
        });
        when(groupMemberRepository.findByGroupIdWithUser(eq(groupId), eq(GroupMemberStatus.ACTIVE), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(Collections.emptyList()));

        UserGroup copyResult = userGroupService.copy(groupId, request, operatorId, "Admin");

        assertNotNull(copyResult);
        assertEquals("Phòng Kế Hoạch - Copy", copyResult.getName());
        verify(groupHistoryRepository).save(any(GroupHistory.class));
    }
}
