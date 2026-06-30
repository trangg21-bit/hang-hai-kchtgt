package com.hanghai.kchtg.vts.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KetQuaTimKiemResponse {
    private Long total;
    private String searchTerm;
    private List<HeThongVTSResponse> items;
}
