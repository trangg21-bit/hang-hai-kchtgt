package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CospasSarsatAssetService extends BaseInfraAssetTypeService {

    public CospasSarsatAssetService(InfraAssetService infraAssetService) {
        super(infraAssetService, InfraAssetType.COSPAS_SARSAT_STATION);
    }

    public Page<InfraAssetResponse> findAll(
            String assetCode, String assetName,
            UUID parentOrgUnitId, UUID orgUnitId, UUID usingOrgUnitId,
            UUID cospasSarsatStationId, String types, String assetCondition,
            String approvalStatus, LocalDate updatedFrom, LocalDate updatedTo, Pageable pageable) {
        return infraAssetService.findAll(
                assetCode, assetName, parentOrgUnitId, orgUnitId, usingOrgUnitId,
                null, null, null, null, cospasSarsatStationId,
                null, null, null,
                null, null, null, null, null, null, null, null, null, null,
                types, assetType, assetCondition,
                approvalStatus, updatedFrom, updatedTo, pageable);
    }
}
