package com.hanghai.kchtg.config;

import org.springframework.data.redis.connection.*;
import java.time.Duration;
import java.util.List;
import java.util.Map;

public class NoOpRedisConnectionFactory implements RedisConnectionFactory {
    @Override public RedisConnection getConnection() { return new NoOpRedisConnection(); }
    @Override public RedisConnection getConnectionAt(int dbIndex) { return new NoOpRedisConnection(); }
    @Override public boolean isConnected() { return false; }
    @Override public void afterPropertiesSet() {}
}

class NoOpRedisConnection implements RedisConnection {
    @Override public byte[] exec(List<byte[]> commands) { return null; }
    @Override public Boolean execute(byte[] command, List<byte[]> args) { return false; }
    @Override public void close() {}
    @Override public boolean isOpen() { return false; }
    @Override public void resetState() {}
    @Override public byte[] exec(byte[] script, byte[][] keys, byte[][] values) { return null; }
    @Override public RedisResults exec(byte[][] commands) { return RedisResults.empty(); }
    @Override public byte[] config(byte[] configCommand, byte[] arg) { return null; }
    @Override public void setAutoSync(boolean autoSync) {}
    @Override public boolean isAutoSync() { return false; }
    @Override public Object deserializeRawResult(byte[] rawResult) { return null; }
    @Override public List<byte[]> brpop(long timeout, byte[]... keys) { return null; }
    @Override public List<byte[]> blpop(long timeout, byte[]... keys) { return null; }
    @Override public List<byte[]> blpop(Duration timeout, byte[]... keys) { return null; }
    @Override public List<byte[]> brpoplpush(byte[] source, byte[] destination, long timeout) { return null; }
    @Override public List<byte[]> brpoplpush(byte[] source, byte[] destination, Duration timeout) { return null; }
    @Override public byte[] bulk(byte[] command) { return null; }
    @Override public byte[] configGet(byte[] pattern) { return null; }
    @Override public Long configSet(byte[] parameter, byte[] value) { return 0L; }
    @Override public void copy(byte[] source, byte[] destination, int dbIndex, boolean replaceDestination) {}
    @Override public byte[] dump(byte[] key) { return null; }
    @Override public Long expire(byte[] key, long timeout, TimeUnit unit) { return 0L; }
    @Override public Boolean expireAt(byte[] key, long unixTime) { return false; }
    @Override public Boolean expireAt(byte[] key, Date date) { return false; }
    @Override public List<byte[]> executePipelined() { return null; }
    @Override public Object executePipelined(byte[] command, List<byte[]> args) { return null; }
    @Override public List<Object> executePipelined(RedisCallback<?> callback) { return null; }
    @Override public List<Object> executePipelined(RedisCallback<?> callback, List<Object> args) { return null; }
    @Override public List<Object> executePipelined(RedisCallback<?> callback, List<byte[]> keys) { return null; }
    @Override public List<Object> executePipelined(RedisCallback<?> callback, List<byte[]> keys, List<byte[]> values) { return null; }
    @Override public RedisResults executePipeline() { return RedisResults.empty(); }
    @Override public List<Object> executeWithReadonlyCheck(byte[] command) { return null; }
    @Override public boolean exists(byte[] key) { return false; }
    @Override public List<byte[]> fcall(byte[] function, int numKeys, byte[]... keysAndArgs) { return null; }
    @Override public byte[] fcallReadonly(byte[] function, int numKeys, byte[]... keysAndArgs) { return null; }
    @Override public Long geoAdd(byte[] key, GeoLocation<GeoPoint> location, double longitude, double latitude) { return 0L; }
    @Override public Long geoAdd(byte[] key, GeoLocation<GeoPoint> location, GeoPosition position) { return 0L; }
    @Override public List<GeoRadiusResponse> geoRadius(byte[] key, double longitude, double latitude, RedisGeoCommands.GeoRadiusCommandArgs args) { return null; }
    @Override public List<GeoRadiusResponse> geoRadius(byte[] key, double longitude, double latitude, GeoRadiusCommandArgs args) { return null; }
    @Override public List<GeoRadiusResponse> geoRadius(byte[] key, RedisGeoCommands.GeoRadiusCommandArgs args) { return null; }
    @Override public List<GeoRadiusResponse> geoRadiusByMember(byte[] key, byte[] member, RedisGeoCommands.GeoRadiusCommandArgs args) { return null; }
    @Override public List<GeoRadiusResponse> geoRadiusByMember(byte[] key, byte[] member, GeoRadiusCommandArgs args) { return null; }
    @Override public List<GeoDistanceResponse> geoSearch(byte[] key, GeoSearchArgs args) { return null; }
    @Override public List<GeoDistanceResponse> geoSearch(byte[] key, GeoSearchOrigin origin, GeoSearchArgs args) { return null; }
    @Override public List<GeoDistanceResponse> geoSearch(byte[] key, RedisGeoCommands.GeoSearchArgs args) { return null; }
    @Override public List<Long> geoHash(byte[] key, byte[]... members) { return null; }
    @Override public List<GeoPosition> geoPosition(byte[] key, byte[]... members) { return null; }
    @Override public Double geoDistance(byte[] key, byte[] member1, byte[] member2, GeoDistanceUnit unit) { return 0.0; }
    @Override public List<GeoCoordinates> geoCoord(byte[] key, byte[]... members) { return null; }
    @Override public Long hDel(byte[] key, byte[]... fields) { return 0L; }
    @Override public Boolean hexists(byte[] key, byte[] field) { return false; }
    @Override public byte[] hGet(byte[] key, byte[] field) { return null; }
    @Override public Map<byte[], byte[]> hGetAll(byte[] key) { return Map.of(); }
    @Override public List<byte[]> hMGet(byte[] key, byte[]... fields) { return null; }
    @Override public Boolean hMSet(byte[] key, Map<byte[], byte[]> hash) { return false; }
    @Override public Long hSet(byte[] key, byte[] field, byte[] value) { return 0L; }
    @Override public Long hSetNX(byte[] key, byte[] field, byte[] value) { return 0L; }
    @Override public Long hSet(byte[] key, Map<byte[], byte[]> hash) { return 0L; }
    @Override public Long hStrLen(byte[] key, byte[] field) { return 0L; }
    @Override public Long hLen(byte[] key) { return 0L; }
    @Override public Boolean lSet(byte[] key, long index, byte[] value) { return false; }
    @Override public Long lInsert(byte[] key, ListOperations.ListDirection direction, byte[] pivot, byte[] value) { return 0L; }
    @Override public Boolean lPush(byte[] key, byte[]... values) { return false; }
    @Override public Long lPushX(byte[] key, byte[] value) { return 0L; }
    @Override public Long lPush(byte[] key, byte[] value) { return 0L; }
    @Override public List<byte[]> lRange(byte[] key, long start, long end) { return null; }
    @Override public Long lRem(byte[] key, long count, byte[] value) { return 0L; }
    @Override public byte[] lIndex(byte[] key, long index) { return null; }
    @Override public byte[] lPop(byte[] key) { return null; }
    @Override public byte[] lPop(byte[] key, Duration timeout) { return null; }
    @Override public byte[] rPop(byte[] key) { return null; }
    @Override public byte[] rPop(byte[] key, Duration timeout) { return null; }
    @Override public Long rPush(byte[] key, byte[] value) { return 0L; }
    @Override public Boolean rPushX(byte[] key, byte[] value) { return false; }
    @Override public Boolean rename(byte[] key, byte[] newKey) { return false; }
    @Override public Boolean renameNX(byte[] key, byte[] newKey) { return false; }
    @Override public byte[] rPopLPush(byte[] source, byte[] destination) { return null; }
    @Override public List<byte[]> sort(byte[] key, RedisSortCommandArgs args) { return null; }
    @Override public Long sAdd(byte[] key, byte[]... values) { return 0L; }
    @Override public Long sRem(byte[] key, byte[]... values) { return 0L; }
    @Override public Set<byte[]> sMembers(byte[] key) { return null; }
    @Override public Set<byte[]> sInter(byte[]... keys) { return null; }
    @Override public Long sInterStore(byte[] destination, byte[]... keys) { return 0L; }
    @Override public Long sUnionStore(byte[] destination, byte[]... keys) { return 0L; }
    @Override public Boolean sIsMember(byte[] key, byte[] value) { return false; }
    @Override public Long sCard(byte[] key) { return 0L; }
    @Override public byte[] sPop(byte[] key) { return null; }
    @Override public byte[] sRandMember(byte[] key) { return null; }
    @Override public Long scan(byte[] cursor, RedisScanArgs args) { return 0L; }
    @Override public RedisScanResult scan(byte[] cursor, RedisScanArgs args) { return RedisScanResult.empty(); }
    @Override public Boolean set(byte[] key, byte[] value) { return false; }
    @Override public Boolean set(byte[] key, byte[] value, SetArgs args) { return false; }
    @Override public Long size(byte[] key) { return 0L; }
    @Override public Set<byte[]> sort(byte[] key) { return null; }
    @Override public Long zAdd(byte[] key, double score, byte[] value) { return 0L; }
    @Override public Long zAdd(byte[] key, ZSetOperations.ZTuple tuple, double score) { return 0L; }
    @Override public Boolean zAddIfNotExists(byte[] key, double score, byte[] value) { return false; }
    @Override public Boolean zAddIfExists(byte[] key, double score, byte[] value) { return false; }
    @Override public Long zRem(byte[] key, byte[]... values) { return 0L; }
    @Override public Double zIncrBy(byte[] key, double score, byte[] value) { return 0.0; }
    @Override public Long zCard(byte[] key) { return 0L; }
    @Override public Long zCard(byte[] key, byte[][] values) { return 0L; }
    @Override public Double zScore(byte[] key, byte[] value) { return 0.0; }
    @Override public Long zCount(byte[] key, double min, double max) { return 0L; }
    @Override public Long zCount(byte[] key, RedisGeoCommands.ZCountArgs args) { return 0L; }
    @Override public Long zCount(byte[] key, Range<byte[]> min, Range<byte[]> max) { return 0L; }
    @Override public Set<byte[]> zRange(byte[] key, long start, long end) { return null; }
    @Override public Set<byte[]> zRangeWithScores(byte[] key, long start, long end) { return null; }
    @Override public Set<byte[]> zRangeByScore(byte[] key, double min, double max) { return null; }
    @Override public Set<byte[]> zRangeByScore(byte[] key, double min, double max, long offset, long count) { return null; }
    @Override public Set<byte[]> zRangeByScoreWithScores(byte[] key, double min, double max) { return null; }
    @Override public Set<byte[]> zRangeByScoreWithScores(byte[] key, double min, double max, long offset, long count) { return null; }
    @Override public Set<byte[]> zRangeByLex(byte[] key, Range<byte[]> min, Range<byte[]> max) { return null; }
    @Override public Set<byte[]> zRangeByLex(byte[] key, Range<byte[]> min, Range<byte[]> max, long offset, long count) { return null; }
    @Override public Set<byte[]> zReverseRange(byte[] key, long start, long end) { return null; }
    @Override public Set<byte[]> zReverseRangeWithScores(byte[] key, long start, long end) { return null; }
    @Override public Set<byte[]> zReverseRangeByScore(byte[] key, double min, double max) { return null; }
    @Override public Set<byte[]> zReverseRangeByScore(byte[] key, double min, double max, long offset, long count) { return null; }
    @Override public Set<byte[]> zReverseRangeByScoreWithScores(byte[] key, double min, double max) { return null; }
    @Override public Set<byte[]> zReverseRangeByScoreWithScores(byte[] key, double min, double max, long offset, long count) { return null; }
    @Override public Set<byte[]> zReverseRangeByLex(byte[] key, Range<byte[]> min, Range<byte[]> max) { return null; }
    @Override public Set<byte[]> zReverseRangeByLex(byte[] key, Range<byte[]> min, Range<byte[]> max, long offset, long count) { return null; }
    @Override public Long zRemRangeByRank(byte[] key, long start, long end) { return 0L; }
    @Override public Long zRemRangeByScore(byte[] key, double min, double max) { return 0L; }
    @Override public Long zRemRangeByLex(byte[] key, Range<byte[]> min, Range<byte[]> max) { return 0L; }
    @Override public Long zRank(byte[] key, byte[] value) { return 0L; }
    @Override public Long zRevRank(byte[] key, byte[] value) { return 0L; }
    @Override public List<byte[]> zPopMin(byte[] key, int count) { return null; }
    @Override public List<byte[]> zPopMax(byte[] key, int count) { return null; }
    @Override public Set<byte[]> zUnion(byte[]... keys) { return null; }
    @Override public Set<byte[]> zUnionWithScores(byte[]... keys) { return null; }
    @Override public Set<byte[]> zInter(byte[]... keys) { return null; }
    @Override public Set<byte[]> zInterWithScores(byte[]... keys) { return null; }
    @Override public Set<byte[]> zDiff(byte[]... keys) { return null; }
    @Override public Set<byte[]> zDiffWithScores(byte[]... keys) { return null; }
    @Override public List<byte[]> zUnionAndStore(byte[] destination, byte[]... keys) { return null; }
    @Override public List<byte[]> zInterAndStore(byte[] destination, byte[]... keys) { return null; }
    @Override public Long zUnionAndStore(byte[] destination, RedisZSetCommands.ZAggregateOptions options, byte[]... keys) { return 0L; }
    @Override public Long zInterAndStore(byte[] destination, RedisZSetCommands.ZAggregateOptions options, byte[]... keys) { return 0L; }
    @Override public List<byte[]> zUnionAndStore(byte[] destination, RedisZSetCommands.ZAggregateOptions options, byte[][] keys) { return null; }
    @Override public List<byte[]> zInterAndStore(byte[] destination, RedisZSetCommands.ZAggregateOptions options, byte[][] keys) { return null; }
    @Override public List<byte[]> zInterAndStore(byte[] destination, byte[]... keys) { return null; }
    @Override public List<byte[]> zUnionAndStore(byte[] destination, byte[]... keys) { return null; }
}