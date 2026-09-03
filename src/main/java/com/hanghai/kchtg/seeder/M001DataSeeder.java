package com.hanghai.kchtg.seeder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.entity.OperatingUnit;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.repository.OperatingUnitRepository;
import com.hanghai.kchtg.group.entity.*;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.user.entity.*;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(10)
@Profile({"local-h2"})
@RequiredArgsConstructor
@Slf4j
public class M001DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final GroupRepository groupRepo;
    private final GroupMemberRepository groupMemberRepo;
    private final OrgUnitRepository orgUnitRepo;
    private final OperatingOrganizationRepository operatingOrganizationRepo;
    private final OperatingUnitRepository operatingUnitRepo;
    private final OrgUnitCacheService orgUnitCacheService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("M-001 seeding check...");
        seedOrgUnits();
        seedOperatingOrganizations();
        seedOperatingUnits();

        if (userRepo.count() == 0) {
            seedUsers();
            seedGroupMemberships();
        } else {
            // Ensure unique admin user, active status, and Asdqwe@123 password
            List<User> admins = userRepo.findAll().stream().filter(u -> "admin".equalsIgnoreCase(u.getUsername())).toList();
            if (!admins.isEmpty()) {
                User admin = admins.get(0);
                admin.setPassword(passwordEncoder.encode("Asdqwe@123"));
                admin.setStatus(UserStatus.ACTIVE);
                admin.setAccountLockedUntil(null);
                admin.setFailedLoginCount(0);
                admin.setFailedTotpCount(0);
                if (admin.getOrgUnit() == null) {
                    List<OrgUnit> units = orgUnitRepo.findAll();
                    if (!units.isEmpty()) {
                        admin.setOrgUnit(units.get(0));
                    }
                }
                UserGroup adminGroup = groupRepo.findByCode("GRP_ADMINS").orElse(null);
                if (adminGroup != null) {
                    if (admin.getGroups() == null) {
                        admin.setGroups(new ArrayList<>());
                    }
                    if (admin.getGroups().stream().noneMatch(g -> adminGroup.getId().equals(g.getId()))) {
                        admin.getGroups().add(adminGroup);
                    }
                }
                if (admin.getPermissionOverrides() == null) {
                    admin.setPermissionOverrides(new ArrayList<>());
                }
                if (admin.getPermissionOverrides().stream().noneMatch(o -> "*".equals(o.getPermissionCode()))) {
                    admin.getPermissionOverrides().add(new UserPermissionOverride(admin, "*", "Super Admin Wildcard"));
                }
                if (admin.getPermissionOverrides().stream().noneMatch(o -> "admin:all".equals(o.getPermissionCode()))) {
                    admin.getPermissionOverrides().add(new UserPermissionOverride(admin, "admin:all", "Super Admin All"));
                }
                userRepo.save(admin);
                for (int i = 1; i < admins.size(); i++) {
                    User dup = admins.get(i);
                    try {
                        jdbcTemplate.update("DELETE FROM group_members WHERE user_id = ?", dup.getId());
                        userRepo.delete(dup);
                    } catch (Exception ex) {
                        dup.setUsername("admin_dup_" + i);
                        userRepo.save(dup);
                    }
                }
            }
        }
        log.info("M-001 seeding done.");
    }

    private void seedOrgUnits() {
        UUID uatCvHcmId = UUID.fromString("f8e415eb-9ece-4840-9478-e2c0bbb30562");
        if (orgUnitRepo.existsById(uatCvHcmId)) {
            log.info("⏭️ Org units with UAT IDs already exist ({}), skipping...", orgUnitRepo.count());
            return;
        }

        log.info("📦 Seeding OrgUnits with exact UUIDs...");
        try {
            jdbcTemplate.update("UPDATE app_users SET org_unit_id = NULL");
            jdbcTemplate.update("DELETE FROM org_units");
        } catch (Exception ex) {
            log.warn("Could not clean org_units: {}", ex.getMessage());
        }

        Path uatFile = Paths.get("data", "uat_export", "org_units_list.json");
        if (Files.exists(uatFile)) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rootNode = mapper.readTree(uatFile.toFile());
                JsonNode contentNode = rootNode.path("data").path("content");
                if (contentNode.isArray() && contentNode.size() > 0) {
                    Timestamp now = Timestamp.valueOf(LocalDateTime.now());
                    String insertSql = "INSERT INTO org_units (id, name, parent_id, description, detail_address, phone, path, level, rank, sort_order, province, operational_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    for (JsonNode item : contentNode) {
                        UUID id = UUID.fromString(item.path("id").asText());
                        String name = item.path("name").asText();
                        UUID parentId = item.hasNonNull("parentId") ? UUID.fromString(item.path("parentId").asText()) : null;
                        String desc = item.hasNonNull("description") ? item.path("description").asText() : null;
                        String detailAddr = item.hasNonNull("detailAddress") ? item.path("detailAddress").asText() : null;
                        String phone = item.hasNonNull("phone") ? item.path("phone").asText() : null;
                        String path = item.hasNonNull("path") ? item.path("path").asText() : ("/" + id + "/");
                        int level = item.path("level").asInt(1);
                        int sortOrder = item.path("sortOrder").asInt(0);
                        Integer provinceId = item.hasNonNull("provinceId") ? item.path("provinceId").asInt() : null;
                        String rankStr = item.path("rank").asText("DEPARTMENT");
                        OrgUnitRank rank = OrgUnitRank.DEPARTMENT;
                        try { rank = OrgUnitRank.valueOf(rankStr); } catch (Exception ignored) {}

                        jdbcTemplate.update(insertSql, id, name, parentId, desc, detailAddr, phone, path, level, rank.ordinal(), sortOrder, provinceId, 0, now, now);
                    }
                    orgUnitCacheService.evictNow();
                    log.info("✅ Seeded {} OrgUnits with exact UUIDs from UAT export", contentNode.size());
                    return;
                }
            } catch (Exception ex) {
                log.error("Failed to seed from UAT org_units_list.json: {}", ex.getMessage(), ex);
            }
        }

        log.info("📦 Seeding default 21 OrgUnits...");

        String[] names = {
            "Cục Hàng hải và Đường thủy Việt Nam", "Cảng vụ Hàng hải Hải Phòng", "Cảng vụ Hàng hải TP. Hồ Chí Minh",
            "Cảng vụ Hàng hải Quảng Ninh", "Cảng vụ Hàng hải Đà Nẵng", "Cảng vụ Hàng hải Vũng Tàu",
            "Cảng vụ Hàng hải Nha Trang", "Cảng vụ Hàng hải Quy Nhơn", "Cảng vụ Hàng hải Cần Thơ",
            "Cảng vụ Hàng hải Quảng Bình", "Cảng vụ Hàng hải Thanh Hóa", "Cảng vụ Hàng hải Nghệ An",
            "Cảng vụ Hàng hải Hà Tĩnh", "Cảng vụ Hàng hải Quảng Trị", "Cảng vụ Hàng hải Thừa Thiên Huế"
        };

        String[] cities = {
            "Hà Nội", "Hải Phòng", "TP. Hồ Chí Minh", "Quảng Ninh", "Đà Nẵng",
            "Bà Rịa - Vũng Tàu", "Khánh Hòa", "Bình Định", "Cần Thơ", "Quảng Bình",
            "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Trị", "Thừa Thiên Huế"
        };

        OrgUnit root = OrgUnit.builder()
                .name(names[0])
                .detailAddress(cities[0])
                .phone("0241234567")
                .path("/")
                .level(1)
                .rank(rankForLevel(1))
                .sortOrder(1)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .build();
        root = orgUnitRepo.save(root);
        root.setPath("/" + root.getId() + "/");
        root = orgUnitRepo.save(root);

        for (int i = 1; i < 15; i++) {
            OrgUnit u = OrgUnit.builder()
                    .name(names[i])
                    .parentId(root.getId())
                    .detailAddress(cities[i])
                    .phone("024" + (1234567 + i))
                    .path(root.getPath())
                    .level(2)
                    .rank(rankForLevel(2))
                    .sortOrder(i + 1)
                    .operationalStatus(OperationalStatus.OPERATIONAL)
                    .build();
            u = orgUnitRepo.save(u);
            u.setPath(root.getPath() + u.getId() + "/");
            orgUnitRepo.save(u);
        }

        OrgUnit cvHP = orgUnitRepo.findByNameLike("Hải Phòng").stream().findFirst().orElse(null);
        if (cvHP != null) {
            addChild(cvHP, "Đại diện Cảng vụ Hải Phòng tại Đình Vũ", 15);
            addChild(cvHP, "Đại diện Cảng vụ Hải Phòng tại Bạch Đằng", 16);
        }
        OrgUnit cvQN = orgUnitRepo.findByNameLike("Quảng Ninh").stream().findFirst().orElse(null);
        if (cvQN != null) {
            addChild(cvQN, "Đại diện Cảng vụ Quảng Ninh tại Móng Cái", 17);
            addChild(cvQN, "Đại diện Cảng vụ Quảng Ninh tại Vân Đồn", 18);
        }
        OrgUnit cvHCM = orgUnitRepo.findByNameLike("TP. Hồ Chí Minh").stream().findFirst().orElse(null);
        if (cvHCM != null) {
            addChild(cvHCM, "Đại diện Cảng vụ TP.HCM tại Cát Lái", 19);
        }
        OrgUnit cvDN = orgUnitRepo.findByNameLike("Đà Nẵng").stream().findFirst().orElse(null);
        if (cvDN != null) {
            addChild(cvDN, "Đại diện Cảng vụ Đà Nẵng tại Tiên Sa", 20);
        }
        orgUnitCacheService.evictNow();
        log.info("✅ Seeded 21 OrgUnits");
    }

    private void seedOperatingOrganizations() {
        if (operatingOrganizationRepo.count() == 0) {
            log.info("📦 Seeding Operating Organizations...");
            List<OperatingOrganization> list = new ArrayList<>();

            try (InputStream is = getClass().getResourceAsStream("/db/migration/V20260826150500__create_operating_organizations_and_seed_data.sql")) {
                if (is != null) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                    Pattern pattern = Pattern.compile("VALUES\\s*\\('([^']+)',\\s*(NULL|'[^']*'),\\s*'([^']+)'\\)");
                    String line;
                    while ((line = reader.readLine()) != null) {
                        Matcher m = pattern.matcher(line);
                        if (m.find()) {
                            String code = m.group(1);
                            String parentCode = "NULL".equals(m.group(2)) ? null : m.group(2).replace("'", "");
                            String name = m.group(3);
                            list.add(OperatingOrganization.builder()
                                    .code(code)
                                    .parentCode(parentCode)
                                    .name(name)
                                    .build());
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not read operating organizations from migration: {}", ex.getMessage());
            }

            if (list.isEmpty()) {
                list.add(OperatingOrganization.builder().code("DVVH.000001").name("Ban Quản lý các Khu Kinh tế và Khu Công nghiệp tỉnh Quảng Nam").build());
                list.add(OperatingOrganization.builder().code("DVVH.000002").name("Ban Quản Lý Cảng Bến Đầm").build());
                list.add(OperatingOrganization.builder().code("DVVH.000003").name("Ban quản lý cảng Phú Quý").build());
                list.add(OperatingOrganization.builder().code("DVVH.000004").name("Ban Quản lý Cảng tỉnh Quảng Ngãi").build());
                list.add(OperatingOrganization.builder().code("DVVH.000033").name("Công ty Cảng Container Trung tâm Sài Gòn").build());
                list.add(OperatingOrganization.builder().code("DVVH.000034").name("Công ty Cảng Dịch vụ Dầu khí").build());
                list.add(OperatingOrganization.builder().code("DVVH.000040").name("Công ty Cổ phần Cảng Cái Mép Gemadept-Terminal Link").build());
                list.add(OperatingOrganization.builder().code("DVVH.000045").name("Công ty Cổ phần Cảng Đà Nẵng").build());
                list.add(OperatingOrganization.builder().code("DVVH.000048").name("Công ty Cổ phần Cảng Hải Phòng").build());
                list.add(OperatingOrganization.builder().code("DVVH.000054").name("Công ty Cổ phần Cảng Sài Gòn").build());
            }

            operatingOrganizationRepo.saveAll(list);
            log.info("✅ Seeded {} Operating Organizations", operatingOrganizationRepo.count());
        }

        ensureKnownOperatingOrganizations();
    }

    private void ensureKnownOperatingOrganizations() {
        UUID opId1 = UUID.fromString("37e0d496-b1ae-4212-939b-9e80c4f512e5");
        if (!operatingOrganizationRepo.existsById(opId1)) {
            try {
                jdbcTemplate.update("INSERT INTO operating_organizations (id, code, parent_code, name) VALUES (?, ?, ?, ?)",
                        opId1, "DVVH.000000", null, "Công ty CP Quản lý & Vận hành Luồng Hàng hải");
            } catch (Exception ignored) {}
        }
        UUID opId2 = UUID.fromString("527a79f1-fade-472b-9382-88b38c965b13");
        if (!operatingOrganizationRepo.existsById(opId2)) {
            try {
                jdbcTemplate.update("INSERT INTO operating_organizations (id, code, parent_code, name) VALUES (?, ?, ?, ?)",
                        opId2, "DVVH.VTS05", null, "Đơn vị vận hành VTS 05");
            } catch (Exception ignored) {}
        }
        UUID opId3 = UUID.fromString("7eedeaa4-9f53-4d30-b2d8-0712a57a9b5b");
        if (!operatingOrganizationRepo.existsById(opId3)) {
            try {
                jdbcTemplate.update("INSERT INTO operating_organizations (id, code, parent_code, name) VALUES (?, ?, ?, ?)",
                        opId3, "DVVH.VTSTC001", null, "Đơn vị vận hành VTS TC001");
            } catch (Exception ignored) {}
        }
    }

    private void seedOperatingUnits() {
        if (operatingUnitRepo.count() > 0) {
            return;
        }
        List<OperatingOrganization> orgs = operatingOrganizationRepo.findAll();
        for (OperatingOrganization o : orgs) {
            try {
                jdbcTemplate.update("INSERT INTO operating_units (id, code, parent_code, name) VALUES (?, ?, ?, ?)",
                        o.getId(), o.getCode(), o.getParentCode(), o.getName());
            } catch (Exception ignored) {}
        }
        log.info("✅ Seeded {} Operating Units", operatingUnitRepo.count());
    }

    private void addChild(OrgUnit parent, String name, int sort) {
        OrgUnit child = OrgUnit.builder()
                .name(name)
                .parentId(parent.getId())
                .detailAddress(parent.getDetailAddress())
                .phone(parent.getPhone())
                .path(parent.getPath())
                .level(parent.getLevel() + 1)
                .rank(rankForLevel(parent.getLevel() + 1))
                .sortOrder(sort)
                .operationalStatus(OperationalStatus.OPERATIONAL)
                .build();
        child = orgUnitRepo.save(child);
        child.setPath(parent.getPath() + child.getId() + "/");
        orgUnitRepo.save(child);
    }

    private static OrgUnitRank rankForLevel(Integer level) {
        if (level == null || level <= 1) return OrgUnitRank.DEPARTMENT;
        if (level == 2) return OrgUnitRank.BRANCH;
        return OrgUnitRank.REPRESENTATIVE;
    }

    public void seedUsers() {
        if (userRepo.count() > 0) {
            log.info("⏭️ Users already exist, skipping...");
            return;
        }

        log.info("📦 Seeding 15 App Users...");

        List<OrgUnit> units = orgUnitRepo.findAll();
        List<UserGroup> groups = groupRepo.findAll();

        String[] usernames = {
            "admin", "trantmai", "leantuan", "phamdm", "buivanh",
            "nguyenthib", "phamvancl", "hoangthid", "vuvanem", "lethif",
            "nguyenvang", "tranvanh", "phamthii", "vuvank", "lethil"
        };

        String[] fullNames = {
            "Nguyễn Văn An", "Trần Thị Mai", "Lê Anh Tuấn", "Phạm Đức Minh", "Bùi Văn Anh",
            "Nguyễn Thị Bình", "Phạm Văn Cường", "Hoàng Thị Dung", "Vũ Văn Em", "Lê Thị Hoa",
            "Nguyễn Văn Giáp", "Trần Văn Hải", "Phạm Thị Inh", "Vũ Văn Khánh", "Lê Thị Lan"
        };

        String[] emails = {
            "admin@hh.gov.vn", "trantmai@hh.gov.vn", "leantuan@hh.gov.vn", "phamdm@hh.gov.vn", "buivanh@hh.gov.vn",
            "nguyenthib@hh.gov.vn", "phamvancl@hh.gov.vn", "hoangthid@hh.gov.vn", "vuvanem@hh.gov.vn", "lethif@hh.gov.vn",
            "nguyenvang@hh.gov.vn", "tranvanh@hh.gov.vn", "phamthii@hh.gov.vn", "vuvank@hh.gov.vn", "lethil@hh.gov.vn"
        };

        for (int i = 0; i < 15; i++) {
            User u = new User();
            u.setUsername(usernames[i]);
            u.setPassword(passwordEncoder.encode(i == 0 ? "Asdqwe@123" : "password123"));
            u.setEmail(emails[i]);
            u.setFullName(fullNames[i]);
            u.setPhone("09123456" + (78 + i));
            u.setStatus(UserStatus.ACTIVE);

            if (!units.isEmpty()) {
                u.setOrgUnit(units.get(i % units.size()));
            }

            if (!groups.isEmpty()) {
                u.getGroups().add(groups.get(i % groups.size()));
            }

            userRepo.save(u);

            if (!groups.isEmpty()) {
                int[] groupOffsets = {0, 1, 2};
                for (int offset : groupOffsets) {
                    UserGroup group = groups.get((i + offset) % groups.size());
                    if (!groupMemberRepo.existsByUserIdAndUserGroupIdAndStatus(u.getId(), group.getId(), GroupMemberStatus.ACTIVE)) {
                        GroupMember member = new GroupMember();
                        member.setUser(u);
                        member.setUserGroup(group);
                        member.setStatus(GroupMemberStatus.ACTIVE);
                        member.setJoinedAt(java.time.LocalDateTime.now());
                        groupMemberRepo.save(member);
                    }
                }
            }
        }
        log.info("✅ Seeded 15 Users successfully");
    }

    private void seedGroupMemberships() {
        // Additional memberships if needed
    }
}
