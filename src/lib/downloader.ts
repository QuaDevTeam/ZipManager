import { sha256 } from 'hash-wasm';
import { DownloadableZipInfo } from '../types/zip';
import { ProgressCallback } from '../types/manager';

export interface DownloadZipOpts {
  zipInfo: DownloadableZipInfo;
  onProgress?: ProgressCallback;
  // eslint-disable-next-line no-undef
  fetchOptions?: RequestInit;
}

export const downloadZip = async (opts: DownloadZipOpts) => {
  const { zipInfo, onProgress } = opts;
  const { url, hash } = zipInfo;
  const res = await fetch(url, {
    method: 'GET',
    ...opts.fetchOptions,
  });
  if (res.status !== 200 || !res.ok) {
    throw {
      reason: 'Download failed (HTTP_ERROR).',
      res,
    };
  }
  const totalLength = Number(res.headers.get('Content-Length')) || 0;
  if (!res.body) {
    throw {
      reason: 'Empty response body (HTTP_ERROR).',
      res,
    };
  }
  const reader = res.body.getReader();
  // Read out data from remote stream
  const chunks = [];
  let downloadedLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    downloadedLength += value.length;
    // Call onProgress callback when new chunk has been downloaded
    if (typeof onProgress === 'function' && totalLength) {
      onProgress({
        progress: downloadedLength / totalLength,
        url: zipInfo.url,
      });
    }
  }
  // Concatenate chunks
  const zipData = chunks.reduce((res, chunk) => {
    res.set(chunk, res.length);
    return res;
  }, new Uint8Array());
  // Validate downloaded content
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
