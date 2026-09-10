package com.hanghai.kchtg.port.dto.transferarea;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class TransferAreaMooringWaterAreaRequest {

    @Size(max = 2000, message = "Mô tả / phạm vi vùng nước neo đậu không vượt quá 2000 ký tự")
    private String description;

    private String geometryType;

    private UUID mapSymbolId;

    private Integer coordinateSystem;

    private String displayRule;

    private List<TransferAreaMooringWaterAreaAnchorPointRequest> anchorPoints;
}
