package com.hanghai.kchtg.config;

import org.springframework.data.redis.connection.RedisClusterConnection;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisSentinelConnection;

import java.lang.reflect.Proxy;

public class NoOpRedisConnectionFactory implements RedisConnectionFactory {

    @Override
    public RedisConnection getConnection() {
        return newProxy();
    }

    @Override
    public RedisClusterConnection getClusterConnection() {
        return null;
    }

    @Override
    public RedisSentinelConnection getSentinelConnection() {
        return null;
    }

    @Override
    public boolean getConvertPipelineAndTxResults() {
        return false;
    }

    @Override
    public org.springframework.dao.DataAccessException translateExceptionIfPossible(RuntimeException exception) {
        return null;
    }

    private RedisConnection newProxy() {
        return (RedisConnection) Proxy.newProxyInstance(
            getClass().getClassLoader(),
            new Class[]{RedisConnection.class},
            (p, m, a) -> null
        );
    }
}
