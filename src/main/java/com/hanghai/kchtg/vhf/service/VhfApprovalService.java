package com.hanghai.kchtg.vhf.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.vhf.dto.ApprovalRequest;
import com.hanghai.kchtg.vhf.dto.VhfResponse;
import com.hanghai.kchtg.vhf.entity.Vhf;
import com.hanghai.kchtg.vhf.repository.VhfRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for 2-level approval workflow on VHF communication system.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class VhfApprovalService {

  private final VhfRepository vhfRepository;
  private final VhfService vhfService;
  private final InfrastructureApprovalService infrastructureApprovalService;
  private final InfrastructureHistoryRepository historyRepository;
  private final UserRepository userRepository;

  @Transactional
  public VhfResponse submit(UUID id, UUID userId) {
    return submit(id, null, userId);
  }

  @Transactional
  public VhfResponse submit(UUID id, String content, UUID operatorId) {
    Vhf vhf = vhfRepository.findByIdAndDeletedAtIsNull(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));

    infrastructureApprovalService.submit(vhf, InfrastructureType.VHF, operatorId, content);
    vhf.setSubmittedDate(LocalDateTime.now());
    vhf.setSubmittedBy(operatorId);
    vhf.setApprovalContentLevel1(content != null && !content.trim().isEmpty() ? content.trim() : null);
    vhf.setApprovalContentLevel2(null);

    Vhf saved = vhfRepository.save(vhf);
    return vhfService.mapToResponse(saved);
  }

  @Transactional
  public VhfResponse approveC1(UUID id, ApprovalRequest request, UUID operatorId) {
    validateDecision(request);
    Vhf vhf = vhfRepository.findByIdAndDeletedAtIsNull(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));

    infrastructureApprovalService.approveC1(vhf, InfrastructureType.VHF, request.getDecision(), request.getReason(), operatorId);
    vhf.setApprovalContentLevel1(request.getReason());

    Vhf saved = vhfRepository.save(vhf);
    return vhfService.mapToResponse(saved);
  }

  @Transactional
  public VhfResponse approveC2(UUID id, ApprovalRequest request, UUID operatorId) {
    validateDecision(request);
    Vhf vhf = vhfRepository.findByIdAndDeletedAtIsNull(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));

    infrastructureApprovalService.approveC2(vhf, InfrastructureType.VHF, request.getDecision(), request.getReason(), operatorId);
    vhf.setApprovalContentLevel2(request.getReason());

    Vhf saved = vhfRepository.save(vhf);
    return vhfService.mapToResponse(saved);
  }

  private void validateDecision(ApprovalRequest request) {
    if (request == null || request.getDecision() == null
      || !(ApprovalStatus.APPROVED.name().equalsIgnoreCase(request.getDecision())
      || ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision()))) {
      throw new IllegalArgumentException("Quyết định phê duyệt không hợp lệ");
    }
    if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())
      && (request.getReason() == null || request.getReason().trim().isEmpty())) {
      throw new IllegalArgumentException("Lý do từ chối là bắt buộc");
    }
  }

  public List<HistoryEntry> getHistory(UUID id) {
    return getHistory(id, null, null);
  }

  public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize) {
    return getHistory(id, page, pageSize, null, null, null);
  }

  public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
      LocalDateTime fromDate, LocalDateTime toDate) {
    if (!vhfRepository.existsById(id)) {
      throw new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id);
    }
    String normalizedKeyword = normalizeSearchKeyword(keyword);
    boolean paged = page != null && pageSize != null && pageSize > 0;
    List<InfrastructureHistory> list;
    if (normalizedKeyword == null && fromDate == null && toDate == null) {
      list = paged
          ? historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VHF, id, PageRequest.of(page, pageSize))
          : historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VHF, id);
    } else {
      list = historyRepository.searchHistory(InfrastructureType.VHF, id, normalizedKeyword, fromDate, toDate,
          paged ? PageRequest.of(page, pageSize) : Pageable.unpaged());
    }
    Set<UUID> userIds = list.stream()
        .map(InfrastructureHistory::getApprovedBy)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
    Map<UUID, User> userMap = resolveUsers(userIds);
    Map<UUID, String> userNameMap = new HashMap<>();
    userMap.forEach((userId, user) -> userNameMap.put(userId, formatUserIdentity(user)));

    return list.stream()
        .map(h -> HistoryEntry.builder()
            .id(h.getId())
            .approvalLevel(h.getApprovalLevel())
            .status(h.getStatus() != null ? h.getStatus().getCode() : null)
            .approvedBy(h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null)
            .orgUnitName(h.getApprovedBy() != null && userMap.get(h.getApprovedBy()) != null
                && userMap.get(h.getApprovedBy()).getOrgUnit() != null
                    ? userMap.get(h.getApprovedBy()).getOrgUnit().getName()
                    : null)
            .approvedDate(h.getApprovedDate())
            .reason(h.getReason())
            .changedField(h.getChangedField())
            .previousValue(h.getPreviousValue())
            .newValue(h.getNewValue())
            .build())
        .collect(Collectors.toList());
  }

  private static String normalizeSearchKeyword(String keyword) {
    if (keyword == null || keyword.trim().isEmpty()) {
      return null;
    }
    return Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", "")
        .replace('đ', 'd');
  }

  private Map<UUID, User> resolveUsers(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty())
      return Collections.emptyMap();
    Set<UUID> nonNullIds = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
    if (nonNullIds.isEmpty())
      return Collections.emptyMap();
    return userRepository.findAllByIdInWithOrgUnit(nonNullIds).stream()
        .collect(Collectors.toMap(User::getId, user -> user, (first, second) -> first));
  }

  private String formatUserIdentity(User user) {
    if (user == null) return null;
    if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
      return user.getFullName().trim();
    }
    if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
      return user.getUsername().trim();
    }
    return null;
  }

  public Map<String, Object> getAllHistory() {
    return null;
  }
}
