package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.entity.FieldPolicy;
import com.hanghai.kchtg.fieldvisibility.entity.FieldSubjectType;
import com.hanghai.kchtg.fieldvisibility.entity.FieldTargetType;
import com.hanghai.kchtg.fieldvisibility.repository.FieldPolicyRepository;
import com.hanghai.kchtg.fieldvisibility.service.FieldVisibilityService;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserPermissionOverride;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the field-visibility resolution algorithm (WO-BE-4).
 * Pure JUnit + Mockito — no Spring context, no database, no server.
 */
@ExtendWith(MockitoExtension.class)
class FieldVisibilityServiceTest {

        @Mock
        private FieldPolicyRepository fieldPolicyRepository;

        private FieldVisibilityService service;

        @BeforeEach
        void setUp() {
                service = new FieldVisibilityService(fieldPolicyRepository);
        }

        @Test
        void noRulesDefaultsToAllow() {
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of());

                assertEquals(Map.of(), service.resolve(userWithGroupPermission("vts:read"), "vts"));
        }

        @Test
        void seedStyleRuleHidesExactlyUpdatedDateAndNothingElse() {
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.HIDE, 10)));

                Map<String, FieldEffect> resolved = service.resolve(userWithGroupPermission("vts:read"), "vts");

                assertEquals(Map.of("updatedDate", FieldEffect.HIDE), resolved);
        }

        @Test
        void seedRuleDoesNotApplyToAnotherResource() {
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.HIDE, 10)));

                assertEquals(Map.of(), service.resolve(userWithGroupPermission("vts:read"), "port"));
        }

        @Test
        void adminAllBypassesAllRules() {
                // Admin bypass short-circuits BEFORE the repository is queried — stub is
                // lenient.
                lenient().when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.HIDE, 10)));

                assertEquals(Map.of(), service.resolve(adminUser(), "vts"));
        }

        @Test
        void higherPriorityWinsWithinSameSpecificity() {
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.READONLY, 1),
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.HIDE, 10)));

                assertEquals(Map.of("updatedDate", FieldEffect.HIDE),
                                service.resolve(userWithGroupPermission("vts:read"), "vts"));
        }

        @Test
        void userSubjectBeatsPermissionSubjectRegardlessOfPriority() {
                UUID userId = UUID.randomUUID();
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.READONLY, 100),
                                rule(FieldSubjectType.USER, userId.toString(), "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.HIDE, 1)));

                assertEquals(Map.of("updatedDate", FieldEffect.HIDE),
                                service.resolve(userWithGroupPermission("vts:read", userId), "vts"));
        }

        @Test
        void fieldTargetBeatsGroupTargetRegardlessOfPriority() {
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.GROUP, "updatedDate", FieldEffect.HIDE, 100),
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.READONLY, 1)));

                assertEquals(Map.of("updatedDate", FieldEffect.READONLY),
                                service.resolve(userWithGroupPermission("vts:read"), "vts"));
        }

        @Test
        void groupRuleMatchesActiveGroupOnly() {
                UUID groupId = UUID.randomUUID();
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.GROUP, groupId.toString(), "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.HIDE, 10)));

                // ACTIVE group -> rule applies
                assertEquals(Map.of("updatedDate", FieldEffect.HIDE),
                                service.resolve(userWithGroup("vts:read", groupId, GroupStatus.ACTIVE), "vts"));

                // INACTIVE group -> rule skipped -> default ALLOW
                assertEquals(Map.of(),
                                service.resolve(userWithGroup("vts:read", groupId, GroupStatus.INACTIVE), "vts"));
        }

        @Test
        void groupRuleMatchesNullStatusGroup() {
                // F-10: a null-status group matches the ACTIVE-or-null predicate (mirrors
                // User.java:143)
                // and must NOT silently fail open.
                UUID groupId = UUID.randomUUID();
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.GROUP, groupId.toString(), "vts",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.HIDE, 10)));

                assertEquals(Map.of("updatedDate", FieldEffect.HIDE),
                                service.resolve(userWithGroup("vts:read", groupId, null), "vts"));
        }

        @Test
        void wildcardResourceAppliesToAnyResource() {
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "*",
                                                FieldTargetType.FIELD, "updatedDate", FieldEffect.HIDE, 10)));

                assertEquals(Map.of("updatedDate", FieldEffect.HIDE),
                                service.resolve(userWithGroupPermission("vts:read"), "anything"));
        }

        @Test
        void targetAllContributesWildcardKey() {
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.ALL, "*", FieldEffect.HIDE, 10)));

                assertEquals(Map.of("*", FieldEffect.HIDE),
                                service.resolve(userWithGroupPermission("vts:read"), "vts"));
        }

        @Test
        void unauthenticatedUserResolvesToEmpty() {
                // null user short-circuits BEFORE the repository is queried.
                assertEquals(Map.of(), service.resolve(null, "vts"));
        }

        @Test
        void conflictCase1_PermissionHide_UserAllow_ResolvesToAllow() {
                UUID userId = UUID.randomUUID();
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "email", FieldEffect.HIDE, 100),
                                rule(FieldSubjectType.USER, userId.toString(), "vts",
                                                FieldTargetType.FIELD, "email", FieldEffect.ALLOW, 1)));

                Map<String, FieldEffect> resolved = service.resolve(userWithGroupPermission("vts:read", userId), "vts");
                assertEquals(Map.of("email", FieldEffect.ALLOW), resolved);
        }

        @Test
        void conflictCase2_GroupHide_UserAllow_ResolvesToAllow() {
                UUID userId = UUID.randomUUID();
                UUID groupId = UUID.randomUUID();
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.GROUP, groupId.toString(), "vts",
                                                FieldTargetType.FIELD, "email", FieldEffect.HIDE, 100),
                                rule(FieldSubjectType.USER, userId.toString(), "vts",
                                                FieldTargetType.FIELD, "email", FieldEffect.ALLOW, 1)));

                Map<String, FieldEffect> resolved = service
                                .resolve(userWithGroup(userId, "vts:read", groupId, GroupStatus.ACTIVE), "vts");
                assertEquals(Map.of("email", FieldEffect.ALLOW), resolved);
        }

        @Test
        void conflictCase3_UserHide_PermissionAllow_ResolvesToHide() {
                UUID userId = UUID.randomUUID();
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "email", FieldEffect.ALLOW, 100),
                                rule(FieldSubjectType.USER, userId.toString(), "vts",
                                                FieldTargetType.FIELD, "email", FieldEffect.HIDE, 1)));

                Map<String, FieldEffect> resolved = service.resolve(userWithGroupPermission("vts:read", userId), "vts");
                assertEquals(Map.of("email", FieldEffect.HIDE), resolved);
        }

        @Test
        void conflictCase4_SameSpecificity_HigherPriorityWins() {
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "email", FieldEffect.ALLOW, 1),
                                rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                                FieldTargetType.FIELD, "email", FieldEffect.HIDE, 10)));

                Map<String, FieldEffect> resolved = service.resolve(userWithGroupPermission("vts:read"), "vts");
                assertEquals(Map.of("email", FieldEffect.HIDE), resolved);
        }

        @Test
        void enumOrdinalsPreserveLegacyDdlValues() {
                assertEquals(0, FieldEffect.HIDE.ordinal(), "HIDE must remain ordinal 0 for DDL compatibility");
                assertEquals(1, FieldEffect.READONLY.ordinal(), "READONLY must remain ordinal 1 for DDL compatibility");
                assertEquals(2, FieldEffect.ALLOW.ordinal(), "ALLOW must be ordinal 2 (append-only)");
        }

        @Test
        void deterministicTieBreaker_mostRestrictiveEffectWins() {
                // Two policies with identical subject, target, and priority (0), but different
                // effects: READONLY vs HIDE
                FieldPolicy rule1 = rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                FieldTargetType.FIELD, "phone", FieldEffect.READONLY, 0);
                FieldPolicy rule2 = rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                FieldTargetType.FIELD, "phone", FieldEffect.HIDE, 0);

                // Regardless of DB order (rule1 first or rule2 first), HIDE (most restrictive)
                // must win deterministically
                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(rule1, rule2));
                Map<String, FieldEffect> res1 = service.resolve(userWithGroupPermission("vts:read"), "vts");
                assertEquals(Map.of("phone", FieldEffect.HIDE), res1);

                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(rule2, rule1));
                Map<String, FieldEffect> res2 = service.resolve(userWithGroupPermission("vts:read"), "vts");
                assertEquals(Map.of("phone", FieldEffect.HIDE), res2);
        }

        @Test
        void deterministicTieBreaker_exactResourceBeatsWildcard() {
                FieldPolicy wildcard = rule(FieldSubjectType.PERMISSION, "vts:read", "*",
                                FieldTargetType.FIELD, "phone", FieldEffect.READONLY, 0);
                FieldPolicy specific = rule(FieldSubjectType.PERMISSION, "vts:read", "vts",
                                FieldTargetType.FIELD, "phone", FieldEffect.HIDE, 0);

                when(fieldPolicyRepository.findByActiveTrue()).thenReturn(List.of(wildcard, specific));
                Map<String, FieldEffect> res = service.resolve(userWithGroupPermission("vts:read"), "vts");
                assertEquals(Map.of("phone", FieldEffect.HIDE), res);
        }

        // ── helpers ──────────────────────────────────────────────

        private FieldPolicy rule(FieldSubjectType subjectType, String subjectId, String resource,
                        FieldTargetType targetType, String targetKey,
                        FieldEffect effect, int priority) {
                FieldPolicy policy = new FieldPolicy();
                policy.setSubjectType(subjectType);
                policy.setSubjectId(subjectId);
                policy.setResource(resource);
                policy.setTargetType(targetType);
                policy.setTargetKey(targetKey);
                policy.setEffect(effect);
                policy.setPriority(priority);
                policy.setActive(true);
                return policy;
        }

        private User userWithGroupPermission(String permissionCode) {
                return userWithGroup(permissionCode, UUID.randomUUID(), GroupStatus.ACTIVE);
        }

        private User userWithGroupPermission(String permissionCode, UUID userId) {
                return userWithGroup(userId, permissionCode, UUID.randomUUID(), GroupStatus.ACTIVE);
        }

        private User userWithGroup(String permissionCode, UUID groupId, GroupStatus status) {
                return userWithGroup(UUID.randomUUID(), permissionCode, groupId, status);
        }

        private User userWithGroup(UUID userId, String permissionCode, UUID groupId, GroupStatus status) {
                User user = new User();
                user.setId(userId);
                UserGroup group = new UserGroup();
                group.setId(groupId);
                group.setStatus(status);
                group.setPermissions(List.of(permissionCode));
                user.setGroups(new ArrayList<>(List.of(group)));
                user.setPermissionOverrides(new ArrayList<>());
                return user;
        }

        private User adminUser() {
                User user = new User();
                user.setId(UUID.randomUUID());
                UserPermissionOverride override = new UserPermissionOverride();
                override.setPermissionCode("admin:all");
                user.setPermissionOverrides(new ArrayList<>(List.of(override)));
                user.setGroups(new ArrayList<>());
                return user;
        }
}
