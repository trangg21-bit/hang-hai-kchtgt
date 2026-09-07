package com.hanghai.kchtg.shipportcall.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.shipportcall.dto.ShipPortCallCreateRequest;
import com.hanghai.kchtg.shipportcall.dto.ShipPortCallResponse;
import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import com.hanghai.kchtg.shipportcall.repository.ShipPortCallRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for ShipPortCall (F-300 «Tàu biển ra vào cảng biển»).
 * <p>
 * Write-scope: every create validates the target orgUnitId against the current user's
 * {@link OrgUnitScopeService.Scope} — an out-of-scope unit is rejected with 403 before any
 * row is persisted (AC-025-05). Text inputs are trimmed server-side (AC-025-04). The
 * {@code orgUnitFilter} Hibernate filter is activated by {@code @DataScope} on the controller
 * (read scope), so list queries only ever see rows of the caller's own subtree — Cục sees full.
 */
@Service
@RequiredArgsConstructor
public class ShipPortCallService {

    /** Trần số bản ghi mỗi trang cho endpoint danh sách. */
    private static final int MAX_PAGE_SIZE = 200;

    private final ShipPortCallRepository repository;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;

    /**
     * Tạo mới bản ghi tàu biển ra vào cảng biển — trim, write-scope validate, persist.
     *
     * @param request payload of the create form (45 business fields)
     * @param userId  operator id (persisted into {@code created_by}; may be null when anonymous)
     */
    @Transactional
    public ShipPortCallResponse create(ShipPortCallCreateRequest request, UUID userId) {
        if (!orgUnitScopeService.currentUserScope().allows(request.getOrgUnitId())) {
            throw new AccessDeniedException("Đơn vị báo cáo ngoài phạm vi cho phép");
        }

        ShipPortCall entity = new ShipPortCall();
        entity.setOrgUnitId(request.getOrgUnitId());
        entity.setReportDate(request.getReportDate());
        entity.setShipName(trimToNull(request.getShipName()));
        entity.setCallSign(trimToNull(request.getCallSign()));
        entity.setImoNumber(trimToNull(request.getImoNumber()));
        entity.setNationality(trimToNull(request.getNationality()));
        entity.setShipType(trimToNull(request.getShipType()));
        entity.setLength(request.getLength());
        entity.setDraftArrivalDeparture(request.getDraftArrivalDeparture());
        entity.setDwt(request.getDwt());
        entity.setGt(request.getGt());
        entity.setAirDraftActual(request.getAirDraftActual());
        entity.setExportTons(request.getExportTons());
        entity.setExportTeus(request.getExportTeus());
        entity.setExportEmptyTeus(request.getExportEmptyTeus());
        entity.setImportTons(request.getImportTons());
        entity.setImportTeus(request.getImportTeus());
        entity.setImportEmptyTeus(request.getImportEmptyTeus());
        entity.setDomesticInTons(request.getDomesticInTons());
        entity.setDomesticInTeus(request.getDomesticInTeus());
        entity.setDomesticInEmptyTeus(request.getDomesticInEmptyTeus());
        entity.setDomesticOutTons(request.getDomesticOutTons());
        entity.setDomesticOutTeus(request.getDomesticOutTeus());
        entity.setDomesticOutEmptyTeus(request.getDomesticOutEmptyTeus());
        entity.setTransshipmentTons(request.getTransshipmentTons());
        entity.setTransshipmentTeus(request.getTransshipmentTeus());
        entity.setTransitHandlingTons(request.getTransitHandlingTons());
        entity.setTransitHandlingTeus(request.getTransitHandlingTeus());
        entity.setTransitNoHandlingTons(request.getTransitNoHandlingTons());
        entity.setTransitNoHandlingTeus(request.getTransitNoHandlingTeus());
        entity.setCargoGroup(trimToNull(request.getCargoGroup()));
        entity.setCargoType(trimToNull(request.getCargoType()));
        entity.setCargoName(trimToNull(request.getCargoName()));
        entity.setLastPortOfCall(trimToNull(request.getLastPortOfCall()));
        entity.setArrivalPortName(trimToNull(request.getArrivalPortName()));
        entity.setArrivalPortCode(trimToNull(request.getArrivalPortCode()));
        entity.setDeparturePortName(trimToNull(request.getDeparturePortName()));
        entity.setDeparturePortCode(trimToNull(request.getDeparturePortCode()));
        entity.setDestinationPort(trimToNull(request.getDestinationPort()));
        entity.setArrivalDate(request.getArrivalDate());
        entity.setDepartureDate(request.getDepartureDate());
        entity.setIslandRoute(request.getIslandRoute());
        entity.setDangerousGoods(request.getDangerousGoods());
        entity.setShipAgent(trimToNull(request.getShipAgent()));
        entity.setEnterpriseCode(trimToNull(request.getEnterpriseCode()));
        if (userId != null) {
            entity.setCreatedBy(userId);
        }
        return toResponse(repository.save(entity));
    }

    /**
     * Danh sách phân trang theo bộ lọc (org unit + 3 khoảng ngày, boundary from=to inclusive).
     * Default sort: {@code created_at DESC}. Read scope enforced by {@code orgUnitFilter}
     * (activated via {@code @DataScope} on the controller).
     */
    @Transactional(readOnly = true)
    public Page<ShipPortCallResponse> search(
            UUID orgUnitId,
            LocalDate reportDateFrom, LocalDate reportDateTo,
            LocalDate arrivalDateFrom, LocalDate arrivalDateTo,
            LocalDate departureDateFrom, LocalDate departureDateTo,
            int page, int size) {
        Specification<ShipPortCall> specification = buildSpecification(
                orgUnitId, reportDateFrom, reportDateTo,
                arrivalDateFrom, arrivalDateTo, departureDateFrom, departureDateTo);
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return repository.findAll(specification, pageable).map(this::toResponse);
    }

    private Specification<ShipPortCall> buildSpecification(
            UUID orgUnitId,
            LocalDate reportDateFrom, LocalDate reportDateTo,
            LocalDate arrivalDateFrom, LocalDate arrivalDateTo,
            LocalDate departureDateFrom, LocalDate departureDateTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (orgUnitId != null) {
                predicates.add(cb.equal(root.get(ShipPortCall.Fields.orgUnitId), orgUnitId));
            }
            addDateRange(predicates, cb, root.get(ShipPortCall.Fields.reportDate),
                    reportDateFrom, reportDateTo);
            addDateRange(predicates, cb, root.get(ShipPortCall.Fields.arrivalDate),
                    arrivalDateFrom, arrivalDateTo);
            addDateRange(predicates, cb, root.get(ShipPortCall.Fields.departureDate),
                    departureDateFrom, departureDateTo);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void addDateRange(List<Predicate> predicates,
                              jakarta.persistence.criteria.CriteriaBuilder cb,
                              jakarta.persistence.criteria.Path<java.time.LocalDate> path,
                              LocalDate from, LocalDate to) {
        if (from != null) {
            predicates.add(cb.greaterThanOrEqualTo(path, from));
        }
        if (to != null) {
            predicates.add(cb.lessThanOrEqualTo(path, to));
        }
    }

    private ShipPortCallResponse toResponse(ShipPortCall entity) {
        ShipPortCallResponse response = new ShipPortCallResponse();
        response.setId(entity.getId());
        response.setOrgUnitId(entity.getOrgUnitId());
        response.setOrgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()));
        response.setReportDate(entity.getReportDate());
        response.setReportCode(entity.getReportCode());
        response.setReportName(entity.getReportName());
        response.setReportPeriod(entity.getReportPeriod());
        response.setShipName(entity.getShipName());
        response.setCallSign(entity.getCallSign());
        response.setImoNumber(entity.getImoNumber());
        response.setNationality(entity.getNationality());
        response.setShipType(entity.getShipType());
        response.setLength(entity.getLength());
        response.setDraftArrivalDeparture(entity.getDraftArrivalDeparture());
        response.setDwt(entity.getDwt());
        response.setGt(entity.getGt());
        response.setAirDraftActual(entity.getAirDraftActual());
        response.setExportTons(entity.getExportTons());
        response.setExportTeus(entity.getExportTeus());
        response.setExportEmptyTeus(entity.getExportEmptyTeus());
        response.setImportTons(entity.getImportTons());
        response.setImportTeus(entity.getImportTeus());
        response.setImportEmptyTeus(entity.getImportEmptyTeus());
        response.setDomesticInTons(entity.getDomesticInTons());
        response.setDomesticInTeus(entity.getDomesticInTeus());
        response.setDomesticInEmptyTeus(entity.getDomesticInEmptyTeus());
        response.setDomesticOutTons(entity.getDomesticOutTons());
        response.setDomesticOutTeus(entity.getDomesticOutTeus());
        response.setDomesticOutEmptyTeus(entity.getDomesticOutEmptyTeus());
        response.setTransshipmentTons(entity.getTransshipmentTons());
        response.setTransshipmentTeus(entity.getTransshipmentTeus());
        response.setTransitHandlingTons(entity.getTransitHandlingTons());
        response.setTransitHandlingTeus(entity.getTransitHandlingTeus());
        response.setTransitNoHandlingTons(entity.getTransitNoHandlingTons());
        response.setTransitNoHandlingTeus(entity.getTransitNoHandlingTeus());
        response.setPassengersArrival(entity.getPassengersArrival());
        response.setPassengersDeparture(entity.getPassengersDeparture());
        response.setCargoGroup(entity.getCargoGroup());
        response.setCargoType(entity.getCargoType());
        response.setCargoName(entity.getCargoName());
        response.setLastPortOfCall(entity.getLastPortOfCall());
        response.setArrivalPortName(entity.getArrivalPortName());
        response.setArrivalPortCode(entity.getArrivalPortCode());
        response.setDeparturePortName(entity.getDeparturePortName());
        response.setDeparturePortCode(entity.getDeparturePortCode());
        response.setDestinationPort(entity.getDestinationPort());
        response.setArrivalDate(entity.getArrivalDate());
        response.setDepartureDate(entity.getDepartureDate());
        response.setIslandRoute(entity.getIslandRoute());
        response.setDangerousGoods(entity.getDangerousGoods());
        response.setShipAgent(entity.getShipAgent());
        response.setEnterpriseCode(entity.getEnterpriseCode());
        response.setCreatedAt(entity.getCreatedAt());
        response.setCreatedBy(entity.getCreatedBy());
        return response;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
