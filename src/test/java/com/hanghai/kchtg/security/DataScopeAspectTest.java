package com.hanghai.kchtg.security;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataScopeAspectTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private DataScope dataScope;

    @Mock
    private Signature signature;

    @InjectMocks
    private DataScopeAspect aspect;

    private UUID userOrgId;
    private UUID otherOrgId;
    private UUID userId;
    private User testUser;
    private OrgUnit userOrg;
    private OrgUnit otherOrg;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        userOrgId = UUID.randomUUID();
        otherOrgId = UUID.randomUUID();
        userId = UUID.randomUUID();

        userOrg = new OrgUnit();
        userOrg.setId(userOrgId);
        userOrg.setPath("/" + userOrgId);

        otherOrg = new OrgUnit();
        otherOrg.setId(otherOrgId);
        otherOrg.setPath("/" + otherOrgId);

        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("testuser");
        testUser.setOrgUnit(userOrg);

        lenient().when(dataScope.orgField()).thenReturn("orgUnit");
        lenient().when(dataScope.ownerField()).thenReturn("createdBy");
        lenient().when(joinPoint.getSignature()).thenReturn(signature);
        lenient().when(signature.toShortString()).thenReturn("TestClass.testMethod()");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    static class DummyEntity {
        private OrgUnit orgUnit;
        private UUID createdBy;

        public DummyEntity(OrgUnit orgUnit, UUID createdBy) {
            this.orgUnit = orgUnit;
            this.createdBy = createdBy;
        }

        public OrgUnit getOrgUnit() { return orgUnit; }
        public UUID getCreatedBy() { return createdBy; }
    }

    @Test
    void applyDataScope_whenAdmin_shouldProceedUnrestricted() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin", "pass", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        DummyEntity e1 = new DummyEntity(userOrg, UUID.randomUUID());
        DummyEntity e2 = new DummyEntity(otherOrg, UUID.randomUUID());
        when(joinPoint.proceed()).thenReturn(List.of(e1, e2));

        Object result = aspect.applyDataScope(joinPoint, dataScope);

        assertThat((List<?>) result).hasSize(2);
    }

    @Test
    void applyDataScope_whenUserBelongsToOrg_shouldFilterOutOtherOrgRecords() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        DummyEntity myOrgEntity = new DummyEntity(userOrg, UUID.randomUUID());
        DummyEntity otherOrgEntity = new DummyEntity(otherOrg, UUID.randomUUID());
        when(joinPoint.proceed()).thenReturn(List.of(myOrgEntity, otherOrgEntity));

        Object result = aspect.applyDataScope(joinPoint, dataScope);

        List<?> list = (List<?>) result;
        assertThat(list).hasSize(1);
        assertThat(list.get(0)).isEqualTo(myOrgEntity);
    }

    @Test
    void applyDataScope_whenUserIsOwnerOfRecord_shouldAllowAccessEvenIfOtherOrg() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        DummyEntity ownedEntityInOtherOrg = new DummyEntity(otherOrg, userId);
        when(joinPoint.proceed()).thenReturn(List.of(ownedEntityInOtherOrg));

        Object result = aspect.applyDataScope(joinPoint, dataScope);

        List<?> list = (List<?>) result;
        assertThat(list).hasSize(1);
    }

    @Test
    void applyDataScope_whenSingleEntityOutsideOrg_shouldThrowAccessDenied() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                testUser, "pass", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        DummyEntity otherOrgEntity = new DummyEntity(otherOrg, UUID.randomUUID());
        when(joinPoint.proceed()).thenReturn(otherOrgEntity);

        assertThrows(AccessDeniedException.class, () -> aspect.applyDataScope(joinPoint, dataScope));
    }
}
