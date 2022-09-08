import { DownloadableZipInfo } from '../types/zip';
import { destroyDbInstance, getDbInstance, ZipDatabase } from './db';
import { downloadAndUnzip } from './zip';
import { DownloadZipOpts } from './downloader';
import { ProgressCallback } from '../types/manager';

const managers: Record<string, ZipManager> = {};

export default class ZipManager {
  private readonly name: string;
  private readonly db: ZipDatabase;

  public constructor(name = 'default') {
    if (managers[name]) {
      throw new Error("There's a same name manager in the runtime space.");
    }
    this.name = name;
    this.db = getDbInstance(name);
    managers[name] = this;
  }

  /**
   * Load zip assets package from URL
   * @param zipInfo can be an URL or a DownloadableZipInfo
   */
  public async load(
    zipInfo: string | DownloadableZipInfo,
    options?: {
      onProgress?: ProgressCallback;
      // eslint-disable-next-line no-undef
      fetchOptions?: RequestInit;
    },
  ) {
    const formattedZipInfo: DownloadableZipInfo = typeof zipInfo === 'string' ? { url: zipInfo } : zipInfo;
    await downloadAndUnzip(this.db, {
      zipInfo: formattedZipInfo,
      ...options,
    });
  }

  /**
   * Get raw Dexie database item
   * @param zipName zip assets package name
   * @param assetName name of the asset
   * @returns Raw Dexie database item
   */
  public async getRaw(zipName: string, assetName: string) {
    return await this.db.assets.get({
      key: `${zipName}:${assetName}`,
    });
  }

  /**
   * Get asset data from database
   * @param zipName zip assets package name
   * @param assetName name of the asset
   * @returns Data of the asset in Uint8Array
   */
  public async get(zipName: string, assetName: string) {
    const res = await this.db.assets.get({
      key: `${zipName}:${assetName}`,
    });
    if (!res) {
      return null;
    }
    return res.data;
  }

  /**
   * Get asset data by key directly
   * @param key the key of the asset
   * @returns Data of the asset in Uin8Array
   */
  public async getByKey(key: string) {
    const res = await this.db.assets.get({
      key,
    });
    if (!res) {
      return null;
    }
    return res.data;
  }

  /**
   * Get asset data by name
   * @param assetName the name of the asset
   * @returns An asset data array
   */
  public async getByName(assetName: string) {
    const res = await this.db.assets
      .where({
        name: assetName,
      })
      .toArray();
    if (!res) {
      return [];
    }
    return res;
  }

  /**
   * Get only one asset data by name
   * @param assetName the name of the asset
   * @returns Asset data
   */
  public async getOneByName(assetName: string) {
    const res = await this.db.assets
      .where({
        name: assetName,
      })
      .toArray();
    if (!res?.length) {
      return null;
    }
    return res[0]?.data;
  }

  /**
   * List stored asset items
   * @param zipName asset package name
   * @returns stored asset items
   */
  public async list(zipName?: string) {
    if (!zipName) {
      return await this.db.assets.toArray();
    }
    return await this.db.assets
      .where({
        packageName: zipName,
      })
      .toArray();
  }

  /**
   * Check if some asset exists
   * @param zipName zip assets package name
   * @param assetName name of the asset
   * @returns if the asset exists
   */
  public async exists(zipName: string, assetName: string) {
    if (!(await this.getRaw(zipName, assetName))) {
      return false;
    }
    return true;
  }

  /**
   * Remove a certain asset
   * @param zipName zip assets package name
   * @param assetName name of the asset
   */
  public async remove(zipName: string, assetName: string) {
    const asset = await this.getRaw(zipName, assetName);
    if (!asset?.id) {
      return;
    }
    return await this.db.assets.delete(asset.id);
  }

  /**
   * Remove assets by package name
   * @param zipName zip assets package name
   */
  public async removePackage(zipName: string) {
    const collection = await this.db.assets.where({
      packageName: zipName,
    });
    const count = (await collection?.count()) || 0;
    if (!count) {
      return;
    }
    await this.db.assets.bulkDelete((await collection.toArray()).map((item) => item.id!));
  }

  /**
   * Destroy the manager instance
   */
  public destroy() {
    if (!managers[this.name]) {
      return;
    }
    destroyDbInstance(this.name);
    delete managers[this.name];
  }
}
