package com.hanghai.kchtg.datasharing.service;

import com.hanghai.kchtg.datasharing.entity.ShareDataType;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import com.hanghai.kchtg.datasharing.repository.SharedDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NavigationShareService {
    private final SharedDataRepository repository;

    @Transactional(readOnly = true)
    public List<SharedData> getLighthouseData(String recipient) {
        return repository.findByDataType(ShareDataType.LIGHTHOUSE)
            .stream().filter(d -> d.getSharedWith().equals(recipient)).toList();
    }

    @Transactional(readOnly = true)
    public List<SharedData> getBuoyData(String recipient) {
        return repository.findByDataType(ShareDataType.BUOY_SIGN)
            .stream().filter(d -> d.getSharedWith().equals(recipient)).toList();
    }
}
