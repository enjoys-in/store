export interface StreamEntry<T = unknown> {
  id: string; // Typically a timestamp-based ID like "1234567-0"
  data: T;
}

export interface IStream<T = unknown> {
  /**
   * Appends an entry to the stream and returns the entry ID.
   */
  append(data: T): Promise<string>;

  /**
   * Reads entries from the stream.
   * @param startId The ID to start reading from (exclusive). Use "0-0" to read from the beginning.
   * @param limit The maximum number of entries to return.
   */
  read(startId: string, limit?: number): Promise<StreamEntry<T>[]>;
}

export enum StreamEngineType {
  ROCKSDB = 'ROCKSDB',
  // Future extensions:
  // REDIS = 'REDIS'
}


export type StreamEngineConfig = never;