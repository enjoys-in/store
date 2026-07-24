# `@enjoys/store` Project Roadmap

This document tracks the implementation of the 50 capabilities outlined for the embedded backend runtime.

## Core Engine & Architecture
- [x] Node.js N-API / AsyncWorker architecture design
- [x] Store "Modes" (embedded, worker-thread, server)
- [x] Domain-Driven Directory Structure
- [x] Abstract Factory Pattern (`StorageProvider`)
- [x] In-Memory Stub Engine (for DX testing)
- [x] JSON Serialization for `MemoryEngine`
- [x] C++ RocksDB Bindings Initialization
- [x] WriteBatch support for C++

## Phase 1: Core Primitives
- [x] KV Store (`db.kv()`) - *Memory Implemented*
- [x] TTL Cache (`db.cache()`) - *Memory Implemented*
- [x] Queue (`db.queue()`) - *Memory Implemented*
- [x] Append-Only Stream (`db.stream()`)
- [x] Pub/Sub Broker (`db.broker()`)

## Phase 2: Session & Auth
- [x] JWT Blocklist
- [x] Refresh token store
- [x] User/Device Sessions (`db.sessions()`)
- [x] Rate Limiter (`db.rateLimiter()`)

## Phase 3: Advanced Data Structures (Redis-like)
*Note: These functions come under the Redis instance of cache in the RocksDB layer, not as explicit top-level db methods.*
- [x] Hash
- [x] List
- [x] Set
- [x] Sorted Set
- [x] Bitmap
- [x] HyperLogLog
- [x] Bloom Filter
- [x] Geo-spatial

## Phase 4: Concurrency & Distributed Coordination
- [x] Transactions (Optimistic/Pessimistic)
- [x] Read/Write Locks
- [x] Mutex (`db.mutex()`)
- [x] Semaphore (`db.semaphore()`)
- [x] Atomic Operations (Increment, Decrement, CAS)

## Phase 5: Eventing & Reactive
- [x] Watch / Keyspace Notifications (`db.watch()`)
- [x] Live Queries (`db.live()`)
- [x] Event Store (`db.events.append()`)


## Phase 6: Indexing & Search
- [x] Secondary Indexes (`db.collection().index()`)
- [x] Full Text Search
- [x] Time-Series Engine

