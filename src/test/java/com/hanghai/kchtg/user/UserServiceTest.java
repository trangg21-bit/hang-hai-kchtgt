package com.hanghai.kchtg.user;

import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.user.dto.CreateUserRequest;
import com.hanghai.kchtg.user.dto.UpdateUserRequest;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
    private OrgUnitRepository orgUnitRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setUsername("john.doe");
        testUser.setEmail("john@example.com");
        testUser.setPassword("encoded_password");
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setRole("ROLE_USER");
    }

    @Nested
    @DisplayName("Create User")
    class CreateTests {

        @Test
        @DisplayName("Should create user successfully")
        void createUser_success() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("john.doe");
            request.setEmail("john@example.com");
            request.setPassword("Secure123!");
            request.setFullName("John Doe");

            when(userRepository.existsByUsername("john.doe")).thenReturn(false);
            when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
            when(passwordEncoder.encode("Secure123!")).thenReturn("encoded_password");
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            User result = userService.create(request);

            assertNotNull(result);
            assertEquals("john.doe", result.getUsername());
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw when username already exists")
        void createDuplicateUsername_throwsException() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("john.doe");
            request.setEmail("john@example.com");

            when(userRepository.existsByUsername("john.doe")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> userService.create(request));
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when email already exists")
        void createDuplicateEmail_throwsException() {
            CreateUserRequest request = new CreateUserRequest();
            request.setUsername("john.doe");
            request.setEmail("john@example.com");

            when(userRepository.existsByUsername("john.doe")).thenReturn(false);
            when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> userService.create(request));
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Read Users")
    class ReadTests {

        @Test
        @DisplayName("Should find user by ID")
        void findById_success() {
            when(userRepository.findByIdWithRelations(testUserId)).thenReturn(Optional.of(testUser));

            User result = userService.findById(testUserId);
            assertNotNull(result);
            assertEquals(testUserId, result.getId());
        }

        @Test
        @DisplayName("Should return all users")
        void findAll_success() {
            when(userRepository.findAllWithRelations()).thenReturn(List.of(testUser));

            List<User> result = userService.findAll();
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find user by username")
        void findByUsername_success() {
            when(userRepository.findByUsernameWithRelations("john.doe")).thenReturn(Optional.of(testUser));

            User result = userService.findByUsername("john.doe");
            assertNotNull(result);
            assertEquals("john.doe", result.getUsername());
        }

        @Test
        @DisplayName("Should find user by email")
        void findByEmail_success() {
            when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(testUser));

            User result = userService.findByEmail("john@example.com");
            assertNotNull(result);
            assertEquals("john@example.com", result.getEmail());
        }
    }

    @Nested
    @DisplayName("Update User")
    class UpdateTests {

        @Test
        @DisplayName("Should update user details")
        void updateUser_success() {
            UpdateUserRequest request = new UpdateUserRequest();
            request.setEmail("john.new@example.com");
            request.setFullName("John New");

            when(userRepository.findByIdWithRelations(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.existsByEmail("john.new@example.com")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            User result = userService.update(testUserId, request);

            assertNotNull(result);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw when updating email to an existing email")
        void updateDuplicateEmail_throwsException() {
            UpdateUserRequest request = new UpdateUserRequest();
            request.setEmail("jane@example.com");

            when(userRepository.findByIdWithRelations(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> userService.update(testUserId, request));
        }
    }

    @Nested
    @DisplayName("Delete User")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete user")
        void deleteUser_success() {
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            userService.delete(testUserId);

            assertEquals(UserStatus.DELETED, testUser.getStatus());
            assertNotNull(testUser.getDeletedAt());
            verify(userRepository).save(testUser);
        }
    }

    @Nested
    @DisplayName("Change Status")
    class StatusTests {

        @Test
        @DisplayName("Should change user status")
        void changeStatus_success() {
            when(userRepository.findByIdWithRelations(testUserId)).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            User result = userService.changeStatus(testUserId, UserStatus.LOCKED);

            assertNotNull(result);
            assertEquals(UserStatus.LOCKED, testUser.getStatus());
            verify(userRepository).save(testUser);
        }
    }
}
