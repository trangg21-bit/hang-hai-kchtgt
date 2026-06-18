package com.hanghai.kchtg.user;

import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Role testRole;

    @BeforeEach
    void setUp() {
        testRole = new Role();
        testRole.setId(1L);
        testRole.setName("Admin");
        testRole.setCode("ADMIN");
        testRole.setDescription("Administrator role");
        testRole.setPermissions("{\"users\":\"RW\",\"roles\":\"R\",\"orgs\":\"R\"}");

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("john.doe");
        testUser.setEmail("john@example.com");
        testUser.setPasswordHash("$2a$10$abc123");
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setRole(testRole);
        testUser.setCreatedAt(new Date());
        testUser.setUpdatedAt(new Date());
    }

    // ==================== CREATE USER TESTS ====================

    @Test
    void createUser_shouldReturnUser() {
        // Arrange
        var createUserRequest = new com.hanghai.kchtg.user.dto.CreateUserRequest();
        createUserRequest.setUsername("john.doe");
        createUserRequest.setEmail("john@example.com");
        createUserRequest.setPassword("Secure123!");
        createUserRequest.setRoleId(1L);
        createUserRequest.setOrganizationId(1L);

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$encoded");
        when(roleRepository.findById(anyLong())).thenReturn(Optional.of(testRole));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.createUser(createUserRequest);

        // Assert
        assertNotNull(result);
        assertEquals("john.doe", result.getUsername());
        assertEquals("john@example.com", result.getEmail());
        assertEquals(UserStatus.ACTIVE, result.getStatus());
        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode(anyString());
    }

    @Test
    void createUser_shouldThrowWhenUsernameExists() {
        // Arrange
        var createUserRequest = new com.hanghai.kchtg.user.dto.CreateUserRequest();
        createUserRequest.setUsername("john.doe");
        createUserRequest.setEmail("john@example.com");
        createUserRequest.setPassword("Secure123!");

        when(userRepository.existsByUsername("john.doe")).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> userService.createUser(createUserRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_shouldThrowWhenEmailExists() {
        // Arrange
        var createUserRequest = new com.hanghai.kchtg.user.dto.CreateUserRequest();
        createUserRequest.setUsername("john.doe");
        createUserRequest.setEmail("john@example.com");
        createUserRequest.setPassword("Secure123!");

        when(userRepository.existsByUsername("john.doe")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> userService.createUser(createUserRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_shouldThrowWhenPasswordTooShort() {
        // Arrange
        var createUserRequest = new com.hanghai.kchtg.user.dto.CreateUserRequest();
        createUserRequest.setUsername("john.doe");
        createUserRequest.setEmail("john@example.com");
        createUserRequest.setPassword("abc");

        // Act & Assert
        assertThrows(RuntimeException.class, () -> userService.createUser(createUserRequest));
        verify(userRepository, never()).save(any());
    }

    // ==================== READ USER TESTS ====================

    @Test
    void getUserById_shouldReturnUser() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        User result = userService.getUserById(1L);

        // Assert
        assertNotNull(result);
        assertEquals("john.doe", result.getUsername());
        verify(userRepository).findById(1L);
    }

    @Test
    void getUserById_shouldThrowWhenNotFound() {
        // Arrange
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> userService.getUserById(999L));
    }

    @Test
    void listUsers_shouldReturnPaginatedUsers() {
        // Arrange
        List<User> users = List.of(testUser);
        Page<User> page = new PageImpl<>(users);
        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);

        // Act
        Page<User> result = userService.listUsers(PageRequest.of(0, 20));

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(userRepository).findAll(any(Pageable.class));
    }

    @Test
    void searchUsers_shouldFilterByName() {
        // Arrange
        List<User> users = List.of(testUser);
        Page<User> page = new PageImpl<>(users);
        when(userRepository.searchByNameOrEmail("john", any(Pageable.class))).thenReturn(page);

        // Act
        Page<User> result = userService.searchUsers("john", PageRequest.of(0, 20));

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(userRepository).searchByNameOrEmail("john", any(Pageable.class));
    }

    // ==================== UPDATE USER TESTS ====================

    @Test
    void updateUser_shouldChangeEmail() {
        // Arrange
        User existingUser = new User(testUser);
        existingUser.setUsername("john.doe");
        existingUser.setEmail("john@example.com");
        existingUser.setStatus(UserStatus.ACTIVE);

        var updateRequest = new com.hanghai.kchtg.user.dto.UpdateUserRequest();
        updateRequest.setEmail("john.new@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByEmailIgnoringId("john.new@example.com", 1L)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act
        User result = userService.updateUser(1L, updateRequest);

        // Assert
        assertEquals("john.new@example.com", result.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_shouldThrowWhenEmailTaken() {
        // Arrange
        User existingUser = new User(testUser);
        existingUser.setUsername("john.doe");
        existingUser.setEmail("john@example.com");

        var updateRequest = new com.hanghai.kchtg.user.dto.UpdateUserRequest();
        updateRequest.setEmail("jane@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByEmailIgnoringId("jane@example.com", 1L)).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> userService.updateUser(1L, updateRequest));
        verify(userRepository, never()).save(any());
    }

    // ==================== LOCK/UNLOCK TESTS ====================

    @Test
    void lockUser_shouldSetStatusToLocked() {
        // Arrange
        User existingUser = new User(testUser);
        existingUser.setUsername("john.doe");
        existingUser.setEmail("john@example.com");
        existingUser.setStatus(UserStatus.ACTIVE);

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act
        userService.lockUser(1L);

        // Assert
        assertEquals(UserStatus.LOCKED, existingUser.getStatus());
        verify(userRepository).save(existingUser);
    }

    @Test
    void unlockUser_shouldSetStatusToActive() {
        // Arrange
        User existingUser = new User(testUser);
        existingUser.setUsername("john.doe");
        existingUser.setEmail("john@example.com");
        existingUser.setStatus(UserStatus.LOCKED);

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act
        userService.unlockUser(1L);

        // Assert
        assertEquals(UserStatus.ACTIVE, existingUser.getStatus());
        verify(userRepository).save(existingUser);
    }

    // ==================== PASSWORD RESET TESTS ====================

    @Test
    void resetPassword_shouldEncodeNewPassword() {
        // Arrange
        User existingUser = new User(testUser);
        existingUser.setUsername("john.doe");
        existingUser.setEmail("john@example.com");
        existingUser.setStatus(UserStatus.ACTIVE);

        var request = new com.hanghai.kchtg.user.dto.ResetPasswordRequest();
        request.setNewPassword("NewSecure456!");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode("NewSecure456!")).thenReturn("$2a$10$new");
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act
        userService.resetPassword(java.util.UUID.randomUUID(), request);

        // Assert
        assertEquals("$2a$10$new", existingUser.getPasswordHash());
        verify(passwordEncoder).encode("NewSecure456!");
        verify(userRepository).save(existingUser);
    }

    // ==================== DELETE TESTS ====================

    @Test
    void deleteUser_shouldSoftDelete() {
        // Arrange
        User existingUser = new User(testUser);
        existingUser.setUsername("john.doe");
        existingUser.setEmail("john@example.com");
        existingUser.setStatus(UserStatus.ACTIVE);
        existingUser.setDeletedAt(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        // Act
        userService.deleteUser(1L);

        // Assert
        assertNotNull(existingUser.getDeletedAt());
        verify(userRepository).save(existingUser);
    }
}

