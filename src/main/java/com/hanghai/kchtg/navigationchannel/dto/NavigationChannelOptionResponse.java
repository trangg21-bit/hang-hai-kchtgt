package com.hanghai.kchtg.navigationchannel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NavigationChannelOptionResponse {
    private UUID id;
    private String channelCode;
    private String channelName;
    private UUID orgUnitId;
    private UUID seaportId;
}
