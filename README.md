# @enjoys/store (Embedded Backend Runtime)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production_ready-success.svg)

## Description

**@enjoys/store** is a 100% embedded, local-first backend runtime and data structures library built entirely on top of RocksDB. 

## Summary

It provides Redis-like advanced data structures (Hashes, Sets, Lists, Bitmaps, Bloom Filters) and distributed-style concurrency tools (Mutex, Semaphores, Queues, Pub/Sub Brokers) inside a single Node.js process without requiring any external network or server dependencies. All storage and locking logic is executed natively via high-performance, embedded database primitives.

## Project Information

- **Package Name:** `@enjoys/store`
- **Author:** Mullayam Singh
- **Designer:** Mullayam Singh
- **Contributors:** Mullayam Singh
- **Git URL:** `https://github.com/enjoys-in/store`
- **License:** MIT
- **Technology:** Node.js, RocksDB, TypeScript
- **Tags:** `embedded`, `backend`, `rocksdb`, `data structures`, `redis`, `local-first`, `database`

## Setup

Install the dependencies:

```bash
npm install
```

### Docker Usage

> [!IMPORTANT]
> If you are using `@enjoys/store` inside a **Docker container**, you must map a volume for your database directory and ensure the container has read-write (`rw`) permissions for that volume. Because this library relies on an embedded RocksDB database, it needs persistent and writable disk access to function correctly.

## Get started

Build the library:

```bash
npm run build
```

Build the library in watch mode:

```bash
npm run dev
```

Run tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Documentation Index (Domains)

- [Auth Domain](./src/domains/auth/docs.md)
- [Broker Domain](./src/domains/broker/docs.md)
- [Cache Domain](./src/domains/cache/docs.md)
- [Hash Domain](./src/domains/hash/docs.md)
- [KV Domain](./src/domains/kv/docs.md)
- [List Domain](./src/domains/list/docs.md)
- [Set Domain](./src/domains/set/docs.md)
- [Sorted Set Domain](./src/domains/sortedSet/docs.md)
- [Lock Domain](./src/domains/lock/docs.md)
- [Queue Domain](./src/domains/queue/docs.md)
- [Rate Limiter Domain](./src/domains/rateLimiter/docs.md)
- [Sessions Domain](./src/domains/sessions/docs.md)
- [Stream Domain](./src/domains/stream/docs.md)
- [Worker Domain](./src/domains/worker/docs.md)
- [Semaphore Domain](./src/domains/semaphore/docs.md)
- [Watch Domain](./src/domains/watch/docs.md)
