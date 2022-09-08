import { unzip as unzipPackage, Unzipped } from 'fflate';
import { DownloadableZipInfo } from '../types/zip';
import { ZipDatabase } from './db';
import { downloadZip } from './downloader';
import {ProgressCallback} from "../types/manager";

export const unzip = (zipData: ArrayBuffer) => {
  return new Promise<Unzipped>((resolve, reject) => {
    unzipPackage(new Uint8Array(zipData), (err, data) => {
      if (err?.code) {
        reject(err);
      }
      console.log(data);
      resolve(data);
    });
  });
};

const normalizeZipName = (zipInfo: DownloadableZipInfo) => {
  if (zipInfo.name) return zipInfo.name;
  const lastPart = zipInfo.url.slice(zipInfo.url.lastIndexOf('/') + 1);
  if (lastPart.includes('?')) {
    return lastPart.slice(0, lastPart.indexOf('?'));
  }
  return lastPart;
};

export const downloadAndUnzip = async (db: ZipDatabase, zipInfo: DownloadableZipInfo, progressCallback?: ProgressCallback) => {
  const zip = await downloadZip(zipInfo, progressCallback);
  const unzipped = await unzip(zip);
  const zipName = normalizeZipName(zipInfo);
  const dataset = Object.keys(unzipped).map((fileName) => ({
    key: `${zipName}:${fileName}`,
    name: fileName,
    packageName: zipName,
    data: unzipped[fileName],
    ctime: Date.now(),
  }));
  await db.assets.bulkPut(dataset);
};
