package com.hanghai.kchtg.station.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.common.dto.OperatingOrganizationOptionResponse;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tra cứu tên đơn vị khai thác / vận hành theo UUID.
 * Hỗ trợ 3 tầng dữ liệu:
 * 1. Bảng CSDL operating_organizations.
 * 2. Danh mục tĩnh 526 đơn vị khai thác (khớp UUID với frontend operatingOrganizationsData.ts).
 * 3. Bộ đệm đơn vị quản lý OrgUnitCacheService.
 * Đảm bảo luôn trả về tên tiếng Việt rõ nghĩa và không trả về null cho UUID hợp lệ để chống nuốt delta lịch sử.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OperatingOrganizationLookup {

    private final OperatingOrganizationRepository operatingOrganizationRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final ObjectMapper objectMapper;

    private final Map<UUID, String> staticIdToName = new ConcurrentHashMap<>();
    private final Map<String, String> codeToName = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("data/default_operating_organizations.json");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    List<OperatingOrganizationOptionResponse> list = objectMapper.readValue(is, new TypeReference<>() {});
                    for (OperatingOrganizationOptionResponse item : list) {
                        if (item.getId() != null && item.getName() != null) {
                            staticIdToName.put(item.getId(), item.getName());
                        }
                        if (item.getCode() != null && item.getName() != null) {
                            codeToName.put(item.getCode(), item.getName());
                        }
                    }
                    log.info("Loaded {} static operating organizations from JSON into lookup cache", staticIdToName.size());
                }
            }
        } catch (Exception e) {
            log.warn("Could not load default_operating_organizations.json: {}", e.getMessage());
        }
    }

    /**
     * Tra cứu tên đơn vị khai thác theo UUID.
     *
     * @param id UUID của đơn vị khai thác
     * @return Tên tiếng Việt của đơn vị khai thác, hoặc id.toString() nếu không tìm thấy, hoặc null nếu id == null.
     */
    public String resolveName(UUID id) {
        if (id == null) {
            return null;
        }
        // 1. Kiểm tra trong CSDL operating_organizations
        Optional<OperatingOrganization> fromDb = operatingOrganizationRepository.findById(id);
        if (fromDb.isPresent() && fromDb.get().getName() != null && !fromDb.get().getName().isBlank()) {
            return fromDb.get().getName();
        }
        // 2. Kiểm tra trong danh mục tĩnh 526 đơn vị
        String staticName = staticIdToName.get(id);
        if (staticName != null && !staticName.isBlank()) {
            return staticName;
        }
        // 3. Kiểm tra trong cache OrgUnit
        String orgUnitName = orgUnitCacheService.getName(id);
        if (orgUnitName != null && !orgUnitName.isBlank()) {
            return orgUnitName;
        }
        // 4. Fallback về UUID string để không nuốt delta lịch sử
        return id.toString();
    }
}
