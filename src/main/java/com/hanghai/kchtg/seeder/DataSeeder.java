package com.hanghai.kchtg.seeder;

import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.repository.MapIconRepository;
import com.hanghai.kchtg.gis.line.entity.LineCategory;
import com.hanghai.kchtg.gis.line.repository.LineCategoryRepository;
import com.hanghai.kchtg.gis.point.entity.ObjectCategory;
import com.hanghai.kchtg.gis.point.repository.ObjectCategoryRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonCategory;
import com.hanghai.kchtg.gis.polygon.repository.PolygonCategoryRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ObjectCategoryRepository objectCategoryRepo;
    private final LineCategoryRepository lineCategoryRepo;
    private final PolygonCategoryRepository polygonCategoryRepo;
    private final MapIconRepository mapIconRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("🌱 Starting data seeding...");
        
        seedObjectCategories();
        seedLineCategories();
        seedPolygonCategories();
        seedMapIcons();
        seedUsers();
        
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

    private void seedUsers() {
        if (userRepo.count() > 0) {
            log.info("⏭️ Users already exist, skipping...");
            return;
        }
        
        log.info("📦 Seeding default admin user...");
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setEmail("admin@hh.gov.vn");
        admin.setFullName("System Administrator");
        admin.setRole("ROLE_SUPER_ADMIN");
        admin.setStatus(UserStatus.ACTIVE);
        
        userRepo.save(admin);
        log.info("✅ Seeded admin user successfully");
    }
}
