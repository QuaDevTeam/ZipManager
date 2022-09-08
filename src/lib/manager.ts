import { DownloadableZipInfo } from '../types/zip';
import { destroyDbInstance, getDbInstance, ZipDatabase } from './db';
import { downloadAndUnzip, normalizeZipName } from './zip';
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
    // Firstly, check if the zip is already downloaded
    const normalizedZipName = normalizeZipName(formattedZipInfo);
    const existedMeta = await this.db.meta
      .where({
        bundleName: normalizedZipName,
      })
      .toArray();
    if (existedMeta?.length) {
      // TODO: already downloaded, check remote assets version first
    }
    // Download asset bundle to the local
    await downloadAndUnzip(this.db, {
      zipInfo: formattedZipInfo,
      ...options,
    });
  }

  /**
   * Get raw Dexie database item
   * @param bundleName zip assets bundle name
   * @param assetName name of the asset
   * @returns Raw Dexie database item
   */
  public async getRaw(bundleName: string, assetName: string) {
    const res = await this.db.assets
      .where({
        key: `${bundleName}:${assetName}`,
      })
      .reverse()
      .sortBy('version');
    if (!res?.length) {
      return null;
    }
    return res[0];
  }

  /**
   * Get asset data from database
   * @param bundleName zip assets bundle name
   * @param assetName name of the asset
   * @returns Data of the asset in Uint8Array
   */
  public async get(bundleName: string, assetName: string) {
    const res = await this.db.assets
      .where({
        key: `${bundleName}:${assetName}`,
      })
      .reverse()
      .sortBy('version');
    if (!res?.length) {
      return null;
    }
    return res[0]?.data;
  }

  /**
   * Get asset data by key directly
   * @param key the key of the asset
   * @returns Data of the asset in Uin8Array
   */
  public async getByKey(key: string) {
    const res = await this.db.assets
      .where({
        key,
      })
      .reverse()
      .sortBy('version');
    if (!res?.length) {
      return null;
    }
    return res[0].data;
  }

  /**
   * Get asset data by name
   * @param assetName the name of the asset
   * @returns An asset array
   */
  public async getByName(assetName: string, version?: number) {
    const res = await this.db.assets
      .where({
        name: assetName,
        ...(version ? { version } : null),
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
      .reverse()
      .sortBy('version');
    if (!res?.length) {
      return null;
    }
    return res[0]?.data;
  }

  /**
   * List stored asset items
   * @param zipName asset bundle name
   * @returns stored asset items
   */
  public async list(zipName?: string) {
    if (!zipName) {
      return await this.db.assets.toArray();
    }
    return await this.db.assets
      .where({
        bundleName: zipName,
      })
      .reverse()
      .sortBy('version');
  }

  /**
   * Check if some asset exists
   * @param zipName zip assets bundle name
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
   * @param zipName zip assets bundle name
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
   * Remove assets by bundle name
   * @param zipName zip assets bundle name
   */
  public async removeBundle(zipName: string) {
    const collection = await this.db.assets.where({
      bundleName: zipName,
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
