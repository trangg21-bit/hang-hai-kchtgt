package com.hanghai.kchtg.seeder;

import com.hanghai.kchtg.group.entity.*;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(2)
@Profile({"local-h2"})
@RequiredArgsConstructor
@Slf4j
public class M001DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final GroupRepository groupRepo;
    private final GroupMemberRepository groupMemberRepo;
    private final OrgUnitRepository orgUnitRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("M-001 seeding...");
        seedOrgUnits();
        // seedUserGroups(); // Disabled per user rule
        seedUsers();
        seedGroupMemberships();
        log.info("M-001 seeding done.");
    }

    private void seedOrgUnits() {
        if (orgUnitRepo.count() > 0) {
            log.info("⏭️ Org units already exist, skipping...");
            return;
        }
        log.info("📦 Seeding 15 OrgUnits...");

        String[] codes = {
            "CUC_HHVT", "CV_HH_HP", "CV_HH_HCM", "CV_HH_QN", "CV_HH_DN",
            "CV_HH_VT", "CV_HH_NT", "CV_HH_QNhon", "CV_HH_CT", "CV_HH_QB",
            "CV_HH_TH", "CV_HH_NA", "CV_HH_HT", "CV_HH_QT", "CV_HH_TTH"
        };

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

        // Save root first to get its ID for parentId
        OrgUnit root = OrgUnit.builder()
                .name(names[0])
                .code(codes[0])
                .address(cities[0])
                .phone("024" + 1234567)
                .status(OrgUnitStatus.APPROVED)
                .path("/" + codes[0] + "/")
                .level(1)
                .sortOrder(1)
                .build();
        root = orgUnitRepo.save(root);

        // Save children with parentId pointing to root
        for (int i = 1; i < 15; i++) {
            OrgUnit u = OrgUnit.builder()
                    .name(names[i])
                    .code(codes[i])
                    .parentId(root.getId())
                    .address(cities[i])
                    .phone("024" + (1234567 + i))
                    .status(OrgUnitStatus.APPROVED)
                    .path(root.getPath() + codes[i] + "/")
                    .level(2)
                    .sortOrder(i + 1)
                    .build();
            orgUnitRepo.save(u);
        }

        // --- Level 3: Đại diện under select Cảng vụ ---
        // Nhóm đại diện dưới Cảng vụ Hải Phòng
        OrgUnit cvHP = orgUnitRepo.findByCode("CV_HH_HP").orElse(null);
        if (cvHP != null) {
            addChild(cvHP, "Đại diện Cảng vụ Hải Phòng tại Đình Vũ", "DD_CVHP_DV", 15);
            addChild(cvHP, "Đại diện Cảng vụ Hải Phòng tại Bạch Đằng", "DD_CVHP_BD", 16);
        }
        // Nhóm đại diện dưới Cảng vụ Quảng Ninh
        OrgUnit cvQN = orgUnitRepo.findByCode("CV_HH_QN").orElse(null);
        if (cvQN != null) {
            addChild(cvQN, "Đại diện Cảng vụ Quảng Ninh tại Móng Cái", "DD_CVQN_MC", 17);
            addChild(cvQN, "Đại diện Cảng vụ Quảng Ninh tại Vân Đồn", "DD_CVQN_VD", 18);
        }
        // Nhóm đại diện dưới Cảng vụ TP.HCM
        OrgUnit cvHCM = orgUnitRepo.findByCode("CV_HH_HCM").orElse(null);
        if (cvHCM != null) {
            addChild(cvHCM, "Đại diện Cảng vụ TP.HCM tại Cát Lái", "DD_CVHCM_CL", 19);
        }
        // Nhóm đại diện dưới Cảng vụ Đà Nẵng
        OrgUnit cvDN = orgUnitRepo.findByCode("CV_HH_DN").orElse(null);
        if (cvDN != null) {
            addChild(cvDN, "Đại diện Cảng vụ Đà Nẵng tại Tiên Sa", "DD_CVDN_TS", 20);
        }
        log.info("✅ Seeded 21 OrgUnits (15 L1+L2 + 6 L3 Đại diện)");
    }

    private void addChild(OrgUnit parent, String name, String code, int sort) {
        OrgUnit child = OrgUnit.builder()
                .name(name)
                .code(code)
                .parentId(parent.getId())
                .parentId(parent.getId())
                .address(parent.getAddress())
                .phone(parent.getPhone())
                .status(OrgUnitStatus.APPROVED)
                .path(parent.getPath() + code + "/")
                .level(parent.getLevel() + 1)
                .sortOrder(sort)
                .build();
        orgUnitRepo.save(child);
    }

    private void seedUserGroups() {
        log.info("📦 Checking and seeding UserGroups...");

        String[] codes = {
            "GRP_ADMINS", "GRP_CV_SPECIALISTS", "GRP_CV_LEADERS", "GRP_TC_SPECIALISTS", "GRP_TC_LEADERS",
            "GRP_TECH_MAINT", "GRP_MONITOR_BUOY", "GRP_OPERATOR_STATION", "GRP_REPORT_STAT", "GRP_DOC_RECEIVE",
            "GRP_DOC_APPROVE", "GRP_PARTNER_OPERATOR", "GRP_CONSTRUCT_UNIT", "GRP_INSPECTOR", "GRP_TECH_SUPPORT"
        };

        String[] names = {
            "Nhóm Quản Trị Viên", "Nhóm Chuyên Viên Cảng Vụ", "Nhóm Lãnh Đạo Cảng Vụ",
            "Nhóm Chuyên Viên Tổng Cục", "Nhóm Lãnh Đạo Tổng Cục", "Nhóm Kỹ Thuật Viên Bảo Trì",
            "Nhóm Giám Sát Phao Tiêu", "Nhóm Vận Hành Nhà Trạm", "Nhóm Báo Cáo Thống Kê",
            "Nhóm Tiếp Nhận Hồ Sơ", "Nhóm Phê Duyệt Hồ Sơ", "Nhóm Đối Tác Khai Thác",
            "Nhóm Đơn Vị Thi Công", "Nhóm Thanh Tra Hàng Hải", "Nhóm Hỗ Trợ Kỹ Thuật"
        };

        int seededCount = 0;
        for (int i = 0; i < 15; i++) {
            if (!groupRepo.existsByCode(codes[i])) {
                UserGroup g = new UserGroup();
                g.setName(names[i]);
                g.setCode(codes[i]);
                g.setDescription("Mô tả nhóm " + names[i]);
                g.setStatus(GroupStatus.ACTIVE);
                g.setPermissions(List.of("users:read", "users:create", "users:update"));
                groupRepo.save(g);
                seededCount++;
            }
        }
        if (seededCount > 0) {
            log.info("✅ Seeded {} UserGroups", seededCount);
        } else {
            log.info("⏭️ All 15 UserGroups already exist");
        }
    }

    public void seedUsers() {
        if (userRepo.count() > 0) {
            log.info("⏭️ Users already exist, skipping...");
            return;
        }

        log.info("📦 Seeding 15 App Users...");

        // Fetch seeded OrgUnits & UserGroups
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
            u.setPassword(passwordEncoder.encode(i == 0 ? "admin123" : "password123"));
            u.setEmail(emails[i]);
            u.setFullName(fullNames[i]);
            u.setPhone("09123456" + (78 + i));
            u.setStatus(UserStatus.ACTIVE);

            // Assign OrgUnit
            if (!units.isEmpty()) {
                u.setOrgUnit(units.get(i % units.size()));
            }

            // Assign Group (Legacy list mapping for backward compatibility)
            if (!groups.isEmpty()) {
                u.getGroups().add(groups.get(i % groups.size()));
            }

            userRepo.save(u);

            // Assign Group (via GroupMember junction entity)
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
        log.info("📦 Seeding GroupMemberships...");
        List<User> allUsers = userRepo.findAll();
        List<UserGroup> allGroups = groupRepo.findAll();

        if (allUsers.isEmpty() || allGroups.isEmpty()) {
            log.warn("⏭️ Users or groups not found, skipping group memberships");
            return;
        }

        // Find GRP_ADMINS, GRP_CV_SPECIALISTS, GRP_CV_LEADERS
        UserGroup grpAdmins = allGroups.stream()
                .filter(g -> "GRP_ADMINS".equals(g.getCode()))
                .findFirst().orElse(null);
        UserGroup grpSpecialists = allGroups.stream()
                .filter(g -> "GRP_CV_SPECIALISTS".equals(g.getCode()))
                .findFirst().orElse(null);
        UserGroup grpLeaders = allGroups.stream()
                .filter(g -> "GRP_CV_LEADERS".equals(g.getCode()))
                .findFirst().orElse(null);

        int assigned = 0;
        for (int i = 0; i < allUsers.size(); i++) {
            User user = allUsers.get(i);
            UserGroup targetGroup;

            if (i < 3) {
                targetGroup = grpAdmins;
            } else if (i < 8) {
                targetGroup = grpSpecialists;
            } else {
                targetGroup = grpLeaders;
            }

            if (targetGroup == null) continue;

            if (!groupMemberRepo.existsByUserIdAndUserGroupIdAndStatus(user.getId(), targetGroup.getId(), GroupMemberStatus.ACTIVE)) {
                GroupMember member = new GroupMember();
                member.setUser(user);
                member.setUserGroup(targetGroup);
                member.setStatus(GroupMemberStatus.ACTIVE);
                member.setJoinedAt(java.time.LocalDateTime.now());
                groupMemberRepo.save(member);
                assigned++;
            }
        }
        log.info("✅ Seeded {} GroupMemberships", assigned);
    }
}
