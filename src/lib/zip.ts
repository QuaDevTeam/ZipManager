import { unzip as unzipPackage, Unzipped } from 'fflate';
import { DownloadableZipInfo } from '../types/zip';
import { ZipDatabase } from './db';
import { downloadZip, DownloadZipOpts } from './downloader';

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

export const normalizeZipName = (zipInfo: DownloadableZipInfo) => {
  if (zipInfo.name) return zipInfo.name;
  const lastPart = zipInfo.url.slice(zipInfo.url.lastIndexOf('/') + 1);
  if (lastPart.includes('?')) {
    return lastPart.slice(0, lastPart.indexOf('?'));
  }
  return lastPart;
};

export const downloadAndUnzip = async (db: ZipDatabase, opts: DownloadZipOpts) => {
  const { zipData, hash, version } = await downloadZip(opts);
  const downloadTime = Date.now();
  const unzipped = await unzip(zipData);
  const zipName = normalizeZipName(opts.zipInfo);
  // Put the downloaded data into idb
  const dataset = Object.keys(unzipped).map((fileName) => ({
    key: `${zipName}:${fileName}`,
    name: fileName,
    bundleName: zipName,
    data: unzipped[fileName],
    version,
    createTime: Date.now(),
  }));
  await db.assets.bulkPut(dataset);
  // Save meta into idb
  await db.meta.add({
    version,
    downloadTime,
    bundleName: zipName,
    hash: hash || '',
  });
};
