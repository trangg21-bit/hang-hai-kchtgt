package com.hanghai.kchtg.tramradar.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KetQuaTimKiemResponse {
    private Long total;
    private String searchTerm;
    private List<TramRadarResponse> items;
}
