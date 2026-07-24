import { ICacheEngine } from '../engine';
import { RocksDbListEngine } from '../list/RocksDbListEngine';
import { RocksDbSetEngine } from '../set/RocksDbSetEngine';
import { RocksDbSortedSetEngine } from '../sortedSet/RocksDbSortedSetEngine';
export interface IRocksDbClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

// Simple FNV-1a hash function for strings
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0; // unsigned 32-bit integer
}

// Convert string to base64 for compact storage
function toBase64(arr: Uint8Array): string {
  return Buffer.from(arr).toString('base64');
}

function fromBase64(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'base64'));
}

export class RocksDbRedisEngine implements ICacheEngine {
  constructor(private client: IRocksDbClient) {}

  getListEngine() {
    return new RocksDbListEngine(this.client);
  }

  getSetEngine() {
    return new RocksDbSetEngine(this.client);
  }

  getSortedSetEngine() {
    return new RocksDbSortedSetEngine(this.client);
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.put(key, stringifiedValue);
  }

  async setNX(key: string, value: any, ttlMs?: number): Promise<boolean> {
    const existing = await this.client.get(key);
    if (existing !== null) return false;
    await this.set(key, value, ttlMs);
    return true;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async peek(key: string): Promise<any> {
    return this.get(key);
  }

  async has(key: string): Promise<boolean> {
    return (await this.client.get(key)) !== null;
  }

  async clear(): Promise<void> {}
  async size(): Promise<number> { return 0; }

  // --- Highly Efficient Advanced Data Structures ---

  async setBit(key: string, offset: number, value: number): Promise<number> {
    const data = await this.client.get(key);
    const byteOffset = Math.floor(offset / 8);
    const bitOffset = offset % 8;
    
    let buffer = data ? fromBase64(data) : new Uint8Array(byteOffset + 1);
    if (byteOffset >= buffer.length) {
      const newBuffer = new Uint8Array(byteOffset + 1);
      newBuffer.set(buffer);
      buffer = newBuffer;
    }
    
    const prevByte = buffer[byteOffset];
    const prevBit = (prevByte >> bitOffset) & 1;
    
    if (value === 1) {
      buffer[byteOffset] = prevByte | (1 << bitOffset);
    } else {
      buffer[byteOffset] = prevByte & ~(1 << bitOffset);
    }
    
    await this.client.put(key, toBase64(buffer));
    return prevBit;
  }

  async getBit(key: string, offset: number): Promise<number> {
    const data = await this.client.get(key);
    if (!data) return 0;
    
    const buffer = fromBase64(data);
    const byteOffset = Math.floor(offset / 8);
    if (byteOffset >= buffer.length) return 0;
    
    const bitOffset = offset % 8;
    return (buffer[byteOffset] >> bitOffset) & 1;
  }

  // Proper Bloom Filter (using 3 hash functions and a bit array)
  private readonly BF_SIZE_BITS = 10000;
  private readonly BF_HASH_COUNT = 3;

  private getBfIndices(item: string): number[] {
    const h1 = fnv1a(item);
    const h2 = fnv1a(item + 'SALT');
    const indices = [];
    for (let i = 0; i < this.BF_HASH_COUNT; i++) {
      indices.push((h1 + i * h2) % this.BF_SIZE_BITS);
    }
    return indices;
  }

  async bfAdd(key: string, item: string): Promise<boolean> {
    const data = await this.client.get(key);
    const buffer = data ? fromBase64(data) : new Uint8Array(Math.ceil(this.BF_SIZE_BITS / 8));
    
    const indices = this.getBfIndices(item);
    let added = false;
    
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitIdx = idx % 8;
      if (!((buffer[byteIdx] >> bitIdx) & 1)) {
        buffer[byteIdx] |= (1 << bitIdx);
        added = true;
      }
    }
    
    if (added) {
      await this.client.put(key, toBase64(buffer));
    }
    return added;
  }

  async bfExists(key: string, item: string): Promise<boolean> {
    const data = await this.client.get(key);
    if (!data) return false;
    
    const buffer = fromBase64(data);
    const indices = this.getBfIndices(item);
    
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitIdx = idx % 8;
      if (!((buffer[byteIdx] >> bitIdx) & 1)) {
        return false;
      }
    }
    return true;
  }

  // Proper HyperLogLog Approximation (using 64 buckets)
  private readonly HLL_BUCKETS = 64;

  private countLeadingZeros(hash: number): number {
    let count = 1;
    for (let i = 31; i >= 0; i--) {
      if ((hash >> i) & 1) break;
      count++;
    }
    return count;
  }

  async pfAdd(key: string, items: string[]): Promise<number> {
    const data = await this.client.get(key);
    // 64 buckets fit exactly in 64 bytes
    const registers = data ? fromBase64(data) : new Uint8Array(this.HLL_BUCKETS);
    let changed = false;

    for (const item of items) {
      const hash = fnv1a(item);
      const bucket = hash % this.HLL_BUCKETS;
      const lz = this.countLeadingZeros(hash / this.HLL_BUCKETS);
      if (lz > registers[bucket]) {
        registers[bucket] = lz;
        changed = true;
      }
    }

    if (changed) {
      await this.client.put(key, toBase64(registers));
      return 1;
    }
    return 0;
  }

  async pfCount(key: string): Promise<number> {
    const data = await this.client.get(key);
    if (!data) return 0;
    
    const registers = fromBase64(data);
    let sum = 0;
    for (let i = 0; i < this.HLL_BUCKETS; i++) {
      sum += Math.pow(2, -registers[i]);
    }
    const estimate = (0.709 * this.HLL_BUCKETS * this.HLL_BUCKETS) / sum;
    return Math.round(estimate);
  }

  // Geo-spatial Optimization
  private encodeGeohash(lon: number, lat: number): string {
    const chars = '0123456789bcdefghjkmnpqrstuvwxyz';
    let isEven = true;
    let minLat = -90, maxLat = 90;
    let minLon = -180, maxLon = 180;
    let bit = 0, ch = 0;
    let geohash = '';

    while (geohash.length < 9) {
      if (isEven) {
        const mid = (minLon + maxLon) / 2;
        if (lon > mid) { ch |= (1 << (4 - bit)); minLon = mid; } else { maxLon = mid; }
      } else {
        const mid = (minLat + maxLat) / 2;
        if (lat > mid) { ch |= (1 << (4 - bit)); minLat = mid; } else { maxLat = mid; }
      }
      isEven = !isEven;
      if (bit < 4) { bit++; } else {
        geohash += chars[ch];
        bit = 0; ch = 0;
      }
    }
    return geohash;
  }

  async geoAdd(key: string, longitude: number, latitude: number, member: string): Promise<number> {
    const data = await this.client.get(key);
    // Storing as compact array: [member, geohash, lon, lat]
    const geos: [string, string, number, number][] = data ? JSON.parse(data) : [];
    
    const existingIdx = geos.findIndex(g => g[0] === member);
    const geohash = this.encodeGeohash(longitude, latitude);

    if (existingIdx !== -1) {
      geos[existingIdx] = [member, geohash, longitude, latitude];
      await this.client.put(key, JSON.stringify(geos));
      return 0; // Updated
    } else {
      geos.push([member, geohash, longitude, latitude]);
      await this.client.put(key, JSON.stringify(geos));
      return 1; // Added
    }
  }

  private haversineDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
    const R = 6371e3;
    const rad = Math.PI / 180;
    const a = Math.sin(((lat2 - lat1) * rad)/2) ** 2 +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(((lon2 - lon1) * rad)/2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  async geoSearch(key: string, longitude: number, latitude: number, radius: number, unit: string): Promise<string[]> {
    const data = await this.client.get(key);
    if (!data) return [];
    const geos: [string, string, number, number][] = JSON.parse(data);
    
    let radiusMeters = radius;
    if (unit === 'km') radiusMeters *= 1000;
    if (unit === 'ft') radiusMeters *= 0.3048;
    if (unit === 'mi') radiusMeters *= 1609.34;

    const results: string[] = [];
    for (const [member, _geohash, lon, lat] of geos) {
      if (this.haversineDistance(longitude, latitude, lon, lat) <= radiusMeters) {
        results.push(member);
      }
    }
    return results;
  }

  // --- Hash Operations ---
  async hset(key: string, field: string, value: any): Promise<void> {
    let data = await this.get(key);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      data = {};
    }
    data[field] = value;
    await this.set(key, data);
  }

  async hget(key: string, field: string): Promise<any> {
    const data = await this.get(key);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data[field] !== undefined ? data[field] : null;
  }

  async hdel(key: string, field: string): Promise<void> {
    const data = await this.get(key);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;
    delete data[field];
    await this.set(key, data);
  }
}

