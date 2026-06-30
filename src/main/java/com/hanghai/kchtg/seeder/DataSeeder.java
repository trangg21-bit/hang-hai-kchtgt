package com.hanghai.kchtg.seeder;

import com.hanghai.kchtg.admin.entity.AdminAccount;
import com.hanghai.kchtg.admin.entity.AdminRole;
import com.hanghai.kchtg.admin.entity.AdminStatus;
import com.hanghai.kchtg.admin.repository.AdminAccountRepository;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.enums.AuthType;
import com.hanghai.kchtg.dataconnection.enums.ConnectionStatus;
import com.hanghai.kchtg.dataconnection.enums.ConnectionType;
import com.hanghai.kchtg.dataconnection.enums.SyncFrequency;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.gis.line.entity.LineCategory;
import com.hanghai.kchtg.gis.line.repository.LineCategoryRepository;
import com.hanghai.kchtg.gis.point.entity.ObjectCategory;
import com.hanghai.kchtg.gis.point.repository.ObjectCategoryRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonCategory;
import com.hanghai.kchtg.gis.polygon.repository.PolygonCategoryRepository;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.UserGroup;
import com.hanghai.kchtg.group.entity.GroupMember;
import com.hanghai.kchtg.group.entity.GroupMemberStatus;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.repository.MapIconRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.user.entity.Role;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.RoleRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(2)
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ObjectCategoryRepository objectCategoryRepo;
    private final LineCategoryRepository lineCategoryRepo;
    private final PolygonCategoryRepository polygonCategoryRepo;
    private final MapIconRepository mapIconRepo;
    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final DataConnectionRepository connectionRepo;
    private final AdminAccountRepository adminAccountRepo;
    private final GroupRepository groupRepo;
    private final GroupMemberRepository groupMemberRepo;
    private final OrgUnitRepository orgUnitRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🌱 Starting data seeding...");

        seedObjectCategories();
        seedLineCategories();
        seedPolygonCategories();
        seedMapIcons();
        seedOrgUnits();
        seedUserGroups();
        seedUsers();
        seedAdminAccounts();
        seedDataConnections();

        log.info("✅ Data seeding completed successfully!");
    }

    private void seedObjectCategories() {
        if (objectCategoryRepo.count() > 0) {
            log.info("⏭️ Object categories already exist, skipping...");
            return;
        }

        log.info("📦 Seeding ObjectCategories...");

        List<ObjectCategory> categories = List.of(
            ObjectCategory.builder().code("CAT_PORT").name("Cảng biển").description("Cảng biển chính và phụ").sortOrder(1).build(),
            ObjectCategory.builder().code("CAT_LIGHTHOUSE").name("Đèn biển").description("Đèn biển, hải đăng").sortOrder(2).build(),
            ObjectCategory.builder().code("CAT_BUOY").name("Phao tiêu").description("Phao tiêu hàng hải").sortOrder(3).build(),
            ObjectCategory.builder().code("CAT_BEACON").name("Đèn hiệu").description("Đèn hiệu hàng hải").sortOrder(4).build(),
            ObjectCategory.builder().code("CAT_OTHER").name("Khác").description("Đối tượng khác thuộc loại Point").sortOrder(5).build()
        );

        objectCategoryRepo.saveAll(categories);
        log.info("✅ Seeded {} ObjectCategories", categories.size());
    }

    private void seedLineCategories() {
        if (lineCategoryRepo.count() > 0) {
            log.info("⏭️ Line categories already exist, skipping...");
            return;
        }

        log.info("📦 Seeding LineCategories...");

        List<LineCategory> categories = List.of(
            LineCategory.builder().code("CAT_COASTLINE").name("Đường bờ biển").description("Đường bờ biển tự nhiên hoặc nhân tạo").sortOrder(1).build(),
            LineCategory.builder().code("CAT_SHIPPING_ROUTE").name("Tuyến hàng hải").description("Tuyến đường hàng hải được quy hoạch").sortOrder(2).build(),
            LineCategory.builder().code("CAT_WATERWAY").name("Đường thủy").description("Đường thủy nội địa hoặc ven biển").sortOrder(3).build(),
            LineCategory.builder().code("CAT_OTHER").name("Khác").description("Đường line khác").sortOrder(4).build()
        );

        lineCategoryRepo.saveAll(categories);
        log.info("✅ Seeded {} LineCategories", categories.size());
    }

    private void seedPolygonCategories() {
        if (polygonCategoryRepo.count() > 0) {
            log.info("⏭️ Polygon categories already exist, skipping...");
            return;
        }

        log.info("📦 Seeding PolygonCategories...");

        List<PolygonCategory> categories = List.of(
            PolygonCategory.builder().code("CAT_WATER_ZONE").name("Vùng nước").description("Khu vực vùng nước").sortOrder(1).build(),
            PolygonCategory.builder().code("CAT_ANCHORAGE").name("Vùng neo đậu").description("Khu vực neo đậu tàu thuyền").sortOrder(2).build(),
            PolygonCategory.builder().code("CAT_STORM_SHELTER").name("Nơi tránh bão").description("Nơi trú ẩn, tránh bão").sortOrder(3).build(),
            PolygonCategory.builder().code("CAT_RESTRICTED").name("Khu vực cấm").description("Khu vực cấm vào / cấm hoạt động").sortOrder(4).build(),
            PolygonCategory.builder().code("CAT_LIMITED").name("Khu vực hạn chế").description("Khu vực hạn chế hoạt động").sortOrder(5).build(),
            PolygonCategory.builder().code("CAT_OTHER").name("Khác").description("Polygon khác").sortOrder(6).build()
        );

        polygonCategoryRepo.saveAll(categories);
        log.info("✅ Seeded {} PolygonCategories", categories.size());
    }

    private void seedMapIcons() {
        if (mapIconRepo.count() > 0) {
            log.info("⏭️ Map icons already exist, skipping...");
            return;
        }

        log.info("📦 Seeding MapIcons...");

        List<MapIcon> icons = List.of(
            MapIcon.builder().code("ICON_PORT").name("Cảng biển").category(MapIcon.Category.WHARF).iconUrl("/icons/port.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_LIGHTHOUSE").name("Đèn biển").category(MapIcon.Category.LIGHTHOUSE).iconUrl("/icons/lighthouse.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_BUOY").name("Phao tiêu").category(MapIcon.Category.BUOY).iconUrl("/icons/buoy.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_BEACON").name("Đèn hiệu").category(MapIcon.Category.BEACON).iconUrl("/icons/beacon.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_DEFAULT").name("Khác").category(MapIcon.Category.OTHER).iconUrl("/icons/default.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_COASTLINE").name("Đường bờ biển").category(MapIcon.Category.OTHER).iconUrl("/icons/coastline.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_SHIPPING_ROUTE").name("Tuyến hàng hải").category(MapIcon.Category.OTHER).iconUrl("/icons/shipping_route.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_WATERWAY").name("Đường thủy").category(MapIcon.Category.OTHER).iconUrl("/icons/waterway.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_DEFAULT_LINE").name("Khác (LINE)").category(MapIcon.Category.OTHER).iconUrl("/icons/line_default.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_WATER_ZONE").name("Vùng nước").category(MapIcon.Category.OTHER).iconUrl("/icons/water_zone.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_ANCHORAGE").name("Vùng neo đậu").category(MapIcon.Category.OTHER).iconUrl("/icons/anchorage.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_STORM_SHELTER").name("Nơi tránh bão").category(MapIcon.Category.OTHER).iconUrl("/icons/storm_shelter.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_RESTRICTED").name("Khu vực cấm").category(MapIcon.Category.OTHER).iconUrl("/icons/restricted.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_LIMITED").name("Khu vực hạn chế").category(MapIcon.Category.OTHER).iconUrl("/icons/limited.png").status(MapIcon.Status.ACTIVE).build(),
            MapIcon.builder().code("ICON_DEFAULT_POLY").name("Khác (POLYGON)").category(MapIcon.Category.OTHER).iconUrl("/icons/poly_default.png").status(MapIcon.Status.ACTIVE).build()
        );

        mapIconRepo.saveAll(icons);
        log.info("✅ Seeded {} MapIcons", icons.size());
    }

    private void seedOrgUnits() {
        if (orgUnitRepo.count() > 0) {
            log.info("⏭️ Org units already exist, skipping...");
            return;
        }
        log.info("📦 Seeding 15 OrgUnits...");

        String[] codes = {
            "ORG_TCDb", "ORG_CVHP", "ORG_CVHCM", "ORG_CVQN", "ORG_CVDN",
            "ORG_CVVT", "ORG_CVNT", "ORG_CVQN2", "ORG_CVCT", "ORG_CVQB",
            "ORG_CVTH", "ORG_CVNA", "ORG_CVHT", "ORG_CVQT", "ORG_CVTTH"
        };

        String[] names = {
            "Tổng Cục Đường Bộ", "Cảng vụ Hàng hải Hải Phòng", "Cảng vụ Hàng hải TP. Hồ Chí Minh",
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

        for (int i = 0; i < 15; i++) {
            OrgUnit u = OrgUnit.builder()
                    .name(names[i])
                    .code(codes[i])
                    .type(i == 0 ? OrgUnitType.CUC : OrgUnitType.CHI_CUC)
                    .address(cities[i])
                    .phone("024" + (1234567 + i))
                    .status(OrgUnitStatus.APPROVED)
                    .path("/" + codes[i] + "/")
                    .level(i == 0 ? 1 : 2)
                    .scopeId(0L)
                    .sortOrder(i + 1)
                    .build();
            orgUnitRepo.save(u);
        }
        log.info("✅ Seeded 15 OrgUnits");
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

        String[] groupTypes = {
            "department", "department", "department", "department", "department",
            "project", "project", "project", "custom", "department",
            "department", "custom", "project", "department", "custom"
        };

        int seededCount = 0;
        for (int i = 0; i < 15; i++) {
            if (!groupRepo.existsByCode(codes[i])) {
                UserGroup g = new UserGroup();
                g.setName(names[i]);
                g.setCode(codes[i]);
                g.setDescription("Mô tả nhóm " + names[i]);
                g.setGroupType(groupTypes[i]);
                g.setStatus(GroupStatus.ACTIVE);
                g.setPermissions(List.of("users:read", "users:create", "users:update", "roles:read"));
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

        // Find existing roles
        Role adminRole = roleRepo.findByCode("ROLE_SYSTEM_ADMIN")
                .orElseThrow(() -> new IllegalStateException("Role not found: ROLE_SYSTEM_ADMIN"));
        Role specialistRole = roleRepo.findByCode("ROLE_SPECIALIST")
                .orElseThrow(() -> new IllegalStateException("Role not found: ROLE_SPECIALIST"));
        Role adminModuleRole = roleRepo.findByCode("ROLE_ADMIN")
                .orElseThrow(() -> new IllegalStateException("Role not found: ROLE_ADMIN"));
                
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
            
            // Assign role
            if (i == 0) {
                u.getRoles().add(adminRole);
            } else if (i < 3) {
                u.getRoles().add(adminModuleRole);
            } else {
                u.getRoles().add(specialistRole);
            }

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
                        member.setRole(offset == 0 ? "admin" : "member");
                        member.setStatus(GroupMemberStatus.ACTIVE);
                        member.setJoinedAt(java.time.LocalDateTime.now());
                        groupMemberRepo.save(member);
                    }
                }
            }
        }
        log.info("✅ Seeded 15 Users successfully");
    }

    private void seedAdminAccounts() {
        if (adminAccountRepo.count() > 0) {
            log.info("⏭️ Admin accounts already exist, skipping...");
            return;
        }

        log.info("📦 Seeding AdminAccounts for default users...");
        userRepo.findAll().forEach(user -> {
            String role = user.getPrimaryRoleCode();
            if ("ROLE_SYSTEM_ADMIN".equals(role)) {
                AdminAccount admin = new AdminAccount();
                admin.setUser(user);
                admin.setRole(AdminRole.SUPER_ADMIN);
                admin.setStatus(AdminStatus.ACTIVE);
                admin.setModules(List.of());
                adminAccountRepo.save(admin);
            } else if ("ROLE_ADMIN".equals(role)) {
                AdminAccount admin = new AdminAccount();
                admin.setUser(user);
                admin.setRole(AdminRole.MODULE_ADMIN);
                admin.setStatus(AdminStatus.ACTIVE);
                admin.setModules(List.of());
                adminAccountRepo.save(admin);
            }
        });
        log.info("✅ Seeded {} AdminAccounts", adminAccountRepo.count());
    }

    private void seedDataConnections() {
        if (connectionRepo.count() > 0) {
            log.info("⏭️ Data connections already exist, skipping...");
            return;
        }

        log.info("📦 Seeding 15 DataConnections...");

        String[] names = {
            "API Dữ liệu Hàng hải Hải Phòng", "API Khí tượng Thủy văn", "Kết nối Phao tiêu luồng trục",
            "API Vận tải biển quốc tế", "Dịch vụ LRIT trung tâm", "Cổng thông tin Cospas-Sarsat",
            "API luồng hàng hải Vũng Tàu", "Kết nối phao tiêu luồng nhánh", "API luồng hàng hải Đà Nẵng",
            "Dịch vụ GIS đường thủy quốc gia", "API dữ liệu cảng biển HCM", "Dịch vụ giám sát AIS Hải Phòng",
            "API luồng hàng hải Quảng Ninh", "Kết nối báo hiệu đèn biển miền Bắc", "Kết nối phao tiêu luồng sông Chanh"
        };

        String[] codes = {
            "CONN_MARITIME_HP", "CONN_METEO_API", "CONN_BUOY_TRUNK",
            "CONN_SHIPPING_INT", "CONN_LRIT_CENTRAL", "CONN_COSPAS_PORTAL",
            "CONN_MARITIME_VT", "CONN_BUOY_BRANCH", "CONN_MARITIME_DN",
            "CONN_GIS_WATERWAY", "CONN_MARITIME_HCM", "CONN_AIS_HP",
            "CONN_MARITIME_QN", "CONN_LIGHTHOUSE_NORTH", "CONN_BUOY_CHANH"
        };

        for (int i = 0; i < 15; i++) {
            DataConnection conn = new DataConnection();
            conn.setName(names[i]);
            conn.setCode(codes[i]);
            conn.setTargetSystem("System " + (i + 1));
            conn.setConnectionType(i % 3 == 0 ? ConnectionType.REST : (i % 3 == 1 ? ConnectionType.DATABASE : ConnectionType.FILE));
            conn.setEndpointUrl("http://localhost:8080/api/v1/integration/conn" + i);
            conn.setAuthType(i % 2 == 0 ? AuthType.TOKEN : AuthType.BASIC);
            conn.setCredentials("secret-credentials-token-" + i);
            conn.setSyncFrequency(i % 2 == 0 ? SyncFrequency.MANUAL : SyncFrequency.HOURLY);
            conn.setStatus(i % 3 == 2 ? ConnectionStatus.INACTIVE : ConnectionStatus.ACTIVE);
            connectionRepo.save(conn);
        }
        log.info("✅ Seeded 15 DataConnections");
    }
}
