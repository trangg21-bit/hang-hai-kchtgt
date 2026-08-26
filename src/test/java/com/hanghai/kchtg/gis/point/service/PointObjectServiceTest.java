package com.hanghai.kchtg.gis.point.service;

import com.hanghai.kchtg.gis.point.dto.CreatePointObjectRequest;
import com.hanghai.kchtg.gis.point.dto.PointObjectResponse;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointHistoryRepository;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PointObjectServiceTest {

    @Mock
    private PointObjectRepository repository;

    @Mock
    private PointHistoryRepository historyRepository;

    @Mock
    private GisSpatialObjectRepository spatialRepository;

    @InjectMocks
    private PointObjectService service;

    @Test
    void createPersistsAndReturnsPointCoordinates() {
        CreatePointObjectRequest request = CreatePointObjectRequest.builder()
                .name("Phao kiểm thử")
                .code("PHAO_TEST_01")
                .objectType(PointObject.ObjectType.BUOY)
                .longitude(106.7004)
                .latitude(10.7769)
                .status(PointObject.Status.PUBLISHED)
                .build();

        when(spatialRepository.existsByCode(request.getCode())).thenReturn(false);
        when(repository.save(any(PointObject.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PointObjectResponse response = service.create(request);

        ArgumentCaptor<PointObject> entityCaptor = ArgumentCaptor.forClass(PointObject.class);
        verify(repository).save(entityCaptor.capture());
        assertThat(entityCaptor.getValue().getLongitude()).isEqualTo(106.7004);
        assertThat(entityCaptor.getValue().getLatitude()).isEqualTo(10.7769);
        assertThat(response.getLongitude()).isEqualTo(106.7004);
        assertThat(response.getLatitude()).isEqualTo(10.7769);
    }
}
