import { sha256 } from 'hash-wasm';
import { DownloadableZipInfo } from '../types/zip';

export const downloadZip = async (zipInfo: DownloadableZipInfo) => {
  const { url, hash } = zipInfo;
  const res = await fetch(url, {
    method: 'GET',
  });
  if (res.status !== 200) {
    throw {
      reason: 'Download failed (status not 200).',
      res,
    };
  }
  const zipData = await res.arrayBuffer();
  const zipHash = await sha256(new Uint8Array(zipData));
  if (!hash) {
    return zipData;
  }
  if (zipHash !== hash) {
    throw {
      reason: 'Corrputed package data.',
      res,
      hash: zipHash,
    };
  }
  return zipData;
};
