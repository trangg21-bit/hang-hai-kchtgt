package com.hanghai.kchtg.navigationchannel.service;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.navigationchannel.dto.NavigationChannelHistoryEntry;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Đọc nhật ký thay đổi/phê duyệt của luồng hàng hải từ bảng dùng chung
 * {@code infrastructure_history} (refType = NAVIGATION_CHANNEL).
 * <p>
 * Đồng bộ chuẩn /beacon-stations ({@code BeaconStationService.getHistory}): lọc + phân trang
 * Ở SERVER theo từ khóa / khoảng ngày, gộp bản ghi cấp 1–2 của một lần cập nhật thành MỘT dòng
 * (id ghép {@code <parentId>#<approvalLevel>}) và trả kèm tên đăng nhập + tên đơn vị.
 */
@Service
@RequiredArgsConstructor
public class NavigationChannelHistoryService {

    /** Trạng thái hồ sơ chưa từng gửi duyệt — không có lịch sử để hiển thị. */
    private static final Set<String> UNSUBMITTED_STATUSES = Set.of("DRAFT", "PROPOSED");

    /** Client không truyền page/pageSize: trả tối đa ngần này dòng lịch sử gần nhất. */
    private static final int UNPAGED_HISTORY_LIMIT = 2000;

    private final NavigationChannelRepository channelRepo;
    private final InfrastructureHistoryRepository infrastructureHistoryRepo;
    private final UserRepository userRepository;
    private final OrgUnitCacheService orgUnitCacheService;

    @Transactional(readOnly = true)
    public List<NavigationChannelHistoryEntry> getHistory(
            UUID id, Integer page, Integer pageSize, String keyword, String fromDate, String toDate) {

        NavigationChannel channel = channelRepo.findById(id).orElse(null);
        if (channel == null) {
            return Collections.emptyList();
        }
        // Luôn nạp lịch sử cho mọi trạng thái hồ sơ (kể cả DRAFT) chuẩn VTS
        String normalizedKeyword = normalizeKeyword(keyword);
        boolean paged = page != null && pageSize != null && pageSize > 0;
        LocalDateTime from = parseLocalDateTime(fromDate);
        LocalDateTime to = parseLocalDateTime(toDate);

        List<InfrastructureHistory> rows = loadRows(channel.getId(), normalizedKeyword, from, to, paged, page, pageSize);
        Map<UUID, User> userMap = loadUsers(rows);
        List<NavigationChannelHistoryEntry> entries = new ArrayList<>(rows.size());
        for (InfrastructureHistory row : rows) {
            entries.add(toHistoryEntry(row, userMap, channel));
        }
        return mergeByUpdateSession(entries);
    }

    /**
     * Dòng lịch sử của hồ sơ, lọc + phân trang Ở CSDL bằng {@code searchHistory} — dùng chung với
     * các màn KCHT khác. Truy vấn đó loại ngay tại CSDL các dòng trạng thái quy trình (tạo mới,
     * đổi trạng thái phê duyệt) và dòng không đổi giá trị, đồng thời lọc từ khóa trên
     * changedField/previousValue/newValue. Lọc từ khóa SAU khi phân trang là sai: biên trang tính
     * trên tập chưa lọc nên trang có thể rỗng dù vẫn còn bản ghi khớp ở trang sau.
     */
    private List<InfrastructureHistory> loadRows(
            UUID channelId, String keyword, LocalDateTime from, LocalDateTime to,
            boolean paged, Integer page, Integer pageSize) {

        int pageIndex = paged && page != null && page >= 0 ? page : 0;
        int size = paged ? pageSize : UNPAGED_HISTORY_LIMIT;
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "approvedDate"));
        return infrastructureHistoryRepo.searchHistory(
                InfrastructureType.NAVIGATION_CHANNEL, channelId, keyword, from, to, pageable);
    }

    /**
     * Gộp các bản ghi của cùng một lần cập nhật: một lần lưu hồ sơ sinh ra MỘT dòng LEVEL_1 và
     * có thể kèm MỘT dòng LEVEL_2 ghi lúc duyệt/từ chối. Cả hai cùng refId + cùng approvedDate
     * (ghi trong cùng transaction), nên nhận cặp theo khóa (refId, approvedDate) —
     * bảng infrastructure_history dùng chung không có cột liên kết cha.
     */
    private List<NavigationChannelHistoryEntry> mergeByUpdateSession(List<NavigationChannelHistoryEntry> entries) {
        Map<String, NavigationChannelHistoryEntry> level1ByKey = new LinkedHashMap<>();
        for (NavigationChannelHistoryEntry entry : entries) {
            if (entry.getApprovalLevel() == ApprovalLevel.LEVEL_1) {
                level1ByKey.put(updateSessionKey(entry), entry);
            }
        }
        Map<String, NavigationChannelHistoryEntry> level2ByKey = new LinkedHashMap<>();
        for (NavigationChannelHistoryEntry entry : entries) {
            if (entry.getApprovalLevel() == ApprovalLevel.LEVEL_2) {
                level2ByKey.putIfAbsent(updateSessionKey(entry), entry);
            }
        }

        List<NavigationChannelHistoryEntry> result = new ArrayList<>();
        Set<UUID> emittedLevel1 = new LinkedHashSet<>();
        for (NavigationChannelHistoryEntry entry : entries) {
            if (entry.getApprovalLevel() == ApprovalLevel.LEVEL_2) {
                if (level1ByKey.containsKey(updateSessionKey(entry))) {
                    continue;
                }
            } else if (entry.getApprovalLevel() == ApprovalLevel.LEVEL_1) {
                if (!emittedLevel1.add(entry.getId())) {
                    continue;
                }
                NavigationChannelHistoryEntry level2 = level2ByKey.get(updateSessionKey(entry));
                if (level2 != null) {
                    entry.setStatus(level2.getStatus() != null ? level2.getStatus() : entry.getStatus());
                    entry.setReason(level2.getReason() != null ? level2.getReason() : entry.getReason());
                }
            }
            result.add(entry);
        }
        return result;
    }

    private static String updateSessionKey(NavigationChannelHistoryEntry entry) {
        return entry.getOrgUnitName() + "|" + (entry.getApprovedDate() != null ? entry.getApprovedDate() : "");
    }

    private Map<UUID, User> loadUsers(List<InfrastructureHistory> rows) {
        Set<UUID> ids = new LinkedHashSet<>();
        for (InfrastructureHistory row : rows) {
            if (row.getApprovedBy() != null) {
                ids.add(row.getApprovedBy());
            }
        }
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, User> map = new LinkedHashMap<>();
        for (User user : userRepository.findAllById(ids)) {
            map.put(user.getId(), user);
        }
        return map;
    }

    private NavigationChannelHistoryEntry toHistoryEntry(
            InfrastructureHistory row, Map<UUID, User> userMap, NavigationChannel channel) {
        String userName = resolveUserName(row.getApprovedBy(), userMap);
        String orgUnitName = channel.getOrgUnitId() != null ? orgUnitCacheService.getName(channel.getOrgUnitId()) : null;
        if (orgUnitName == null || orgUnitName.isBlank()) {
            orgUnitName = "Cục Hàng hải Việt Nam";
        }

        String prevDisp = row.getPreviousValue();
        String newDisp = row.getNewValue();

        // Lịch sử tệp đính kèm chỉ đọc snapshot đã lưu tại thời điểm thao tác (previousValue/newValue).
        // CẤM suy diễn lại từ danh sách tệp HIỆN TẠI của hồ sơ (xem kcht-change-history-audit).
        return NavigationChannelHistoryEntry.builder()
                .id(row.getId())
                .approvalLevel(row.getApprovalLevel())
                .status(row.getStatus() != null ? row.getStatus().getCode() : null)
                .approvedBy(userName)
                .orgUnitName(orgUnitName)
                .approvedDate(row.getApprovedDate())
                .reason(row.getReason())
                .changedField(canonicalizeFieldName(row.getChangedField()))
                .previousValue(prevDisp)
                .newValue(newDisp)
                .build();
    }

    private String resolveUserName(UUID userId, Map<UUID, User> userMap) {
        if (userId == null) {
            return "Hệ thống";
        }
        User user = userMap.get(userId);
        if (user == null) {
            user = userRepository.findById(userId).orElse(null);
        }
        if (user == null) {
            return "Hệ thống";
        }
        if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
            return user.getFullName();
        }
        if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
            return user.getUsername();
        }
        return "Hệ thống";
    }

    private static String normalizeKeyword(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return Normalizer.normalize(value.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    /** Chuẩn hóa tên trường (nhận cả nhãn tiếng Việt do dữ liệu cũ ghi vào) về camelCase. */
    private static String canonicalizeFieldName(String field) {
        if (field == null) {
            return "";
        }
        return switch (field.trim().toLowerCase(Locale.ROOT)) {
            case "tên luồng hàng hải", "ten luong hang hai", "channelname" -> "channelName";
            case "mã luồng hàng hải", "ma luong hang hai", "channelcode" -> "channelCode";
            case "đơn vị quản lý", "don vi quan ly", "orgunitid", "unitid" -> "orgUnitId";
            case "đơn vị khai thác", "don vi khai thac", "operatingunitid" -> "operatingUnitId";
            case "tình trạng", "tinh trang", "conditionstatus" -> "conditionStatus";
            case "địa điểm chi tiết", "dia diem chi tiet", "detailedlocation" -> "detailedLocation";
            default -> Objects.requireNonNullElse(field.trim(), "");
        };
    }

    private static LocalDateTime parseLocalDateTime(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            String v = value.trim();
            if (v.length() == 10) {
                v = v + "T00:00:00";
            } else {
                v = v.replace(" ", "T");
            }
            return LocalDateTime.parse(v);
        } catch (Exception e) {
            return null;
        }
    }
}
