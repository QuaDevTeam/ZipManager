import { sha256 } from 'hash-wasm';
import { DownloadableZipInfo } from '../types/zip';
import { ProgressCallback } from '../types/manager';

export interface DownloadZipOpts {
  zipInfo: DownloadableZipInfo;
  onProgress?: ProgressCallback;
  // eslint-disable-next-line no-undef
  fetchOptions?: RequestInit;
}

export interface CheckVersionOpts {
  zipInfo: DownloadableZipInfo;
  // eslint-disable-next-line no-undef
  fetchOptions?: RequestInit;
}

export const downloadZip = async (opts: DownloadZipOpts) => {
  const { zipInfo, onProgress } = opts;
  const { url, hash } = zipInfo;
  // Request the latest bundle
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
  try {
    if (hash) {
      const zipHash = await sha256(new Uint8Array(zipData));
      if (zipHash !== hash) {
        throw {
          reason: 'Corrputed package data.',
          res,
          hash: zipHash,
        };
      }
    }
  } catch (err) {
    console.error(err);
    throw {
      reason: 'Cannot validate the downloaded data.',
      res,
      originalError: err,
    };
  }
  return {
    zipData,
    hash,
    version: Number(res.headers.get('X-Qua-Version')) || Date.now(),
  };
};

/**
 * Get the version of the remote asset bundle
 */
export const checkRemoteZipVersion = (opts: CheckVersionOpts) => {
  // TODO: send a head request to check remote asset version
};
