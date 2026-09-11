package com.hanghai.kchtg.orgunit.config;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Startup runner: seeds demo org hierarchy if DB is empty, then fixes missing parent_id.
 */
@Component
@Order(1)
public class OrgUnitDataFixer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(OrgUnitDataFixer.class);
    private static final Set<String> ALLOWED_ROOT_CODES = Set.of("G17", "G17.43", "G17.72", "G17.74");
    private final OrgUnitRepository repo;
    private final OrgUnitCacheService cacheService;

    public OrgUnitDataFixer(OrgUnitRepository repo, OrgUnitCacheService cacheService) {
        this.repo = repo;
        this.cacheService = cacheService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            long count = repo.count();
            log.info("OrgUnitDataFixer: {} org units in DB", count);

            if (count == 0) {
                seedDemoData();
                count = repo.count();
                log.info("OrgUnitDataFixer: seeded {} demo org units", count);
            }

            fixOrphans();
            cacheService.evictNow();
            log.info("OrgUnitDataFixer: evicted orgUnit cache to ensure fresh hierarchy");

        } catch (Exception e) {
            log.error("OrgUnitDataFixer: failed", e);
        }
    }

    private void seedDemoData() {
        OrgUnit root = OrgUnit.builder()
                .name("Bộ Giao thông Vận tải")
                .description("Cơ quan quản lý nhà nước cấp Bộ - Đơn vị gốc hệ thống")
                .parentId(null)
                .level(0)
                .rank(rankForLevel(0))
                .path("")
                .sortOrder(0)
                .build();
        root = repo.save(root);

        OrgUnit cucHh = child(root, "Cục Hàng hải và Đường thủy Việt Nam", 1);
        OrgUnit cvHp = child(cucHh, "Cảng vụ Hàng hải Hải Phòng", 1);
        OrgUnit cvQn = child(cucHh, "Cảng vụ Hàng hải Quảng Ninh", 2);
        child(cucHh, "Cảng vụ Hàng hải TP. Hồ Chí Minh", 3);

        child(cvHp, "Đại diện Cảng vụ Hải Phòng tại Đình Vũ", 1);
        child(cvHp, "Đại diện Cảng vụ Hải Phòng tại Bạch Đằng", 2);
        child(cvQn, "Đại diện Cảng vụ Quảng Ninh tại Móng Cái", 1);
        child(cvQn, "Đại diện Cảng vụ Quảng Ninh tại Vân Đồn", 2);

        log.info("OrgUnitDataFixer: seeded Bộ GTVT + Cục HHVT + 3 Cảng vụ + 4 Đại diện");
    }

    private OrgUnit child(OrgUnit parent, String name, int sort) {
        OrgUnit child = OrgUnit.builder()
                .name(name)
                .description(name)
                .parentId(parent.getId())
                .level(parent.getLevel() + 1)
                .rank(rankForLevel(parent.getLevel() + 1))
                .path(parent.getPath() + parent.getId() + "/")
                .sortOrder(sort)
                .build();
        return repo.save(child);
    }

    private static OrgUnitRank rankForLevel(Integer level) {
        if (level == null || level <= 0) return OrgUnitRank.DEPARTMENT;
        if (level == 1) return OrgUnitRank.DEPARTMENT;
        if (level == 2) return OrgUnitRank.BRANCH;
        return OrgUnitRank.REPRESENTATIVE;
    }

    private static boolean isAllowedRoot(OrgUnit u) {
        if (u.getCode() != null && ALLOWED_ROOT_CODES.contains(u.getCode().trim().toUpperCase())) {
            return true;
        }
        if (u.getName() != null) {
            String n = u.getName().toLowerCase();
            if (n.contains("bộ giao thông") || n.contains("cục hàng hải") || n.contains("bảo đảm an toàn hàng hải") || n.contains("vishipel") || n.contains("thông tin điện tử hàng hải")) {
                return true;
            }
        }
        return false;
    }

    private void fixOrphans() {
        List<OrgUnit> roots = repo.findByParentIdIsNull();
        if (roots.isEmpty()) {
            log.info("OrgUnitDataFixer: no root org units — skipping orphan fix");
            return;
        }

        OrgUnit fallbackRoot = roots.stream()
                .filter(u -> "G17".equalsIgnoreCase(u.getCode()))
                .findFirst()
                .orElse(roots.get(0));

        List<OrgUnit> orphans = roots.stream()
                .filter(u -> !isAllowedRoot(u))
                .filter(u -> !u.getId().equals(fallbackRoot.getId()))
                .toList();

        if (orphans.isEmpty()) {
            log.info("OrgUnitDataFixer: all root org units are valid: {}", roots.stream().map(u -> u.getCode() != null ? u.getCode() : u.getName()).toList());
            return;
        }

        for (OrgUnit o : orphans) {
            o.setParentId(fallbackRoot.getId());
            o.setLevel(2);
            repo.save(o);
            log.info("OrgUnitDataFixer: fixed orphan {} → parent {}", o.getName(), fallbackRoot.getName());
        }

        log.info("OrgUnitDataFixer: fixed {} orphan(s)", orphans.size());
    }
}
