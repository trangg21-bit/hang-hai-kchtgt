package com.hanghai.kchtg.security;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.security.aspect.DataScopeAspect;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataScopeAspectTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrgUnitRepository orgUnitRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private Session session;

    @Mock
    private Filter filter;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature signature;

    @Mock
    private DataScope dataScope;

    @InjectMocks
    private DataScopeAspect aspect;

    private UUID userOrgId;
    private User testUser;
    private User adminUser;

    public void targetMethod(int page, int size, UUID orgUnitId, String search) {
    }

    @BeforeEach
    void setUp() {
        userOrgId = UUID.randomUUID();

        OrgUnit org = new OrgUnit();
        org.setId(userOrgId);

        Role userRole = new Role();
        userRole.setCode("ROLE_INTEGRATION");

        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setOrgUnit(org);
        testUser.setRoles(Set.of(userRole));

        Role adminRole = new Role();
        adminRole.setCode("ROLE_SYSTEM_ADMIN");

        adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setRoles(Set.of(adminRole));

        // Manually construct aspect to ensure correct mock injection
        aspect = new DataScopeAspect(userRepository, orgUnitRepository, entityManager);

        lenient().when(dataScope.orgUnitParam()).thenReturn("orgUnitId");
        lenient().when(entityManager.unwrap(Session.class)).thenReturn(session);
        lenient().when(session.enableFilter("orgUnitFilter")).thenReturn(filter);
        lenient().when(filter.setParameterList(eq("orgUnitIds"), anyCollection())).thenReturn(filter);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void enforceDataScope_whenNationwideRole_shouldProceedUnchanged() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin", "pass", List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByUsernameWithRelations("admin")).thenReturn(Optional.of(adminUser));
        when(joinPoint.proceed()).thenReturn("success");

        Object result = aspect.enforceDataScope(joinPoint, dataScope);

        assertThat(result).isEqualTo("success");
    }

    @Test
    void enforceDataScope_whenOrgUser_shouldActivateFilter() throws Throwable {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "testuser", "pass", List.of(new SimpleGrantedAuthority("ROLE_INTEGRATION")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        when(userRepository.findByUsernameWithRelations("testuser")).thenReturn(Optional.of(testUser));

        Method targetMethod = DataScopeAspectTest.class.getMethod("targetMethod", int.class, int.class, UUID.class, String.class);
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getMethod()).thenReturn(targetMethod);

        Object[] originalArgs = new Object[]{0, 20, UUID.randomUUID(), "test"};
        when(joinPoint.getArgs()).thenReturn(originalArgs);
        when(joinPoint.proceed()).thenReturn("success");

        Object result = aspect.enforceDataScope(joinPoint, dataScope);

        assertThat(result).isEqualTo("success");
        verify(session).enableFilter("orgUnitFilter");
    }
}
