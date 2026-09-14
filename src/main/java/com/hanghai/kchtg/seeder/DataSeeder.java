package com.hanghai.kchtg.seeder;

import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
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
import com.hanghai.kchtg.group.entity.*;
import com.hanghai.kchtg.group.repository.GroupMemberRepository;
import com.hanghai.kchtg.group.repository.GroupRepository;
import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import com.hanghai.kchtg.mapicon.repository.MapIconRepository;
import com.hanghai.kchtg.mapicon.repository.MapSymbolRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;

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
@Profile({"local", "prod", "local-h2"})
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ObjectCategoryRepository objectCategoryRepo;
    private final LineCategoryRepository lineCategoryRepo;
    private final PolygonCategoryRepository polygonCategoryRepo;
    private final MapIconRepository mapIconRepo;
    private final UserRepository userRepo;
    private final DataConnectionRepository connectionRepo;
    private final GroupRepository groupRepo;
    private final GroupMemberRepository groupMemberRepo;
    private final OrgUnitRepository orgUnitRepo;
    private final PasswordEncoder passwordEncoder;
    private final BeaconStationRepository beaconStationRepo;
    private final BuoyRepository buoyRepo;
    private final MapSymbolRepository mapSymbolRepo;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🌱 Starting data seeding...");

        seedObjectCategories();
        seedLineCategories();
        seedPolygonCategories();
        seedMapIcons();
        seedOrgUnits();
        // seedUserGroups(); // Disabled as per user rule to not seed data via Java
        seedUsers();
        // seedBeaconStations();
        // seedBuoys();
        seedDataConnections();
        seedMapSymbols();

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
        if (java.nio.file.Files.exists(java.nio.file.Paths.get("data", "uat_export", "org_units_tree.json"))
                || java.nio.file.Files.exists(java.nio.file.Paths.get("data", "uat_export", "org_units_list.json"))
                || orgUnitRepo.count() > 0) {
            log.info("⏭️ Org units already exist or UAT export present, skipping DataSeeder org units...");
            return;
        }
        log.info("📦 Seeding 15 OrgUnits...");

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
                .detailAddress(cities[0])
                .phone("024" + 1234567)
                .path("/")
                .level(1)
                .rank(rankForLevel(1))
                .sortOrder(1)
                .build();
        root = orgUnitRepo.save(root);
        root.setPath("/" + root.getId() + "/");
        root = orgUnitRepo.save(root);

        // Save children with parentId pointing to root
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
                    .build();
            u = orgUnitRepo.save(u);
            u.setPath(root.getPath() + u.getId() + "/");
            orgUnitRepo.save(u);
        }

        // --- Level 3: Đại diện under select Cảng vụ ---
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
        log.info("✅ Seeded 21 OrgUnits (15 L1+L2 + 6 L3 Đại diện)");
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

    private void seedMapSymbols() {
        if (mapSymbolRepo.count() > 0) {
            log.info("⏭️ Map symbols already exist, skipping...");
            return;
        }

        log.info("📦 Seeding MapSymbols...");

        String defaultImg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTAiIGZpbGw9IiMxNjc3ZmYiLz48L3N2Zz4=";
        List<MapSymbol> symbols = List.of(
            MapSymbol.builder().code("BT-0001").name("Hướng đi").description("Ký hiệu hướng đi của tàu thuyền").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0002").name("Đường chính").description("Ký hiệu luồng hàng hải chính").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0003").name("Tọa độ").description("Ký hiệu điểm mốc tọa độ hải văn").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0004").name("Chia cắt").description("Ký hiệu phân làn giao thông hàng hải").image(defaultImg).status(MapSymbolStatus.INACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0005").name("Cửa tầng").description("Ký hiệu cửa thu nước cảng biển").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0006").name("Bến ngầm").description("Ký hiệu bến đậu ngầm của tàu ngầm").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0007").name("Địa điểm").description("Ký hiệu địa điểm cảng vụ").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0008").name("Phao loại A").description("Ký hiệu phao tiêu chỉ giới loại A").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0009").name("Phao loại B").description("Ký hiệu phao tiêu chỉ giới loại B").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0010").name("Đèn biển chính").description("Hải đăng cấp 1 khu vực ven bờ").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0011").name("Đèn biển phụ").description("Đèn báo hiệu phụ lối vào luồng").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0012").name("Vùng cấm").description("Ký hiệu vùng cấm neo đậu hàng hải").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0013").name("Vùng quay đầu").description("Ký hiệu vùng dành cho tàu quay đầu").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0014").name("Neo bão").description("Ký hiệu khu vực trú bão của tàu").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build(),
            MapSymbol.builder().code("BT-0015").name("Quét lôi").description("Ký hiệu khu vực đang rà quét chướng ngại vật").image(defaultImg).status(MapSymbolStatus.ACTIVE).createdBy(java.util.UUID.randomUUID()).build()
        );

        mapSymbolRepo.saveAll(symbols);
        log.info("✅ Seeded {} MapSymbols", symbols.size());
    }
}
