import Dexie, { Table } from 'dexie';
import { ZipAsset, ZipMeta } from '../types/db';

const DB_VERSION = 1;
const DB_STRUCTURE = {
  assets: '++id, key, name, bundleName, data, createTime',
  meta: '++id, &bundleName, downloadTime, version, hash',
};

export class ZipDatabase extends Dexie {
  public assets!: Table<ZipAsset>;
  public meta!: Table<ZipMeta>;

  public constructor(name: string) {
    super(name);
    this.version(DB_VERSION).stores(DB_STRUCTURE);
  }
}

const dbInstances: Record<string, ZipDatabase> = {};
const prefix = `qua-zdb`;

export const getDbInstance = (name: string) => {
  if (dbInstances[name]) {
    return dbInstances[name];
  }
  const instance = new ZipDatabase(`${prefix}__${name}`);
  dbInstances[name] = instance;
  return instance;
};

export const destroyDbInstance = (name: string) => {
  if (!dbInstances[name]) {
    return;
  }
  dbInstances[name].close();
  delete dbInstances[name];
};
