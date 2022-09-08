import { sha256 } from 'hash-wasm';
import { DownloadableZipInfo } from '../types/zip';
import { ProgressCallback } from "../types/manager";

export const downloadZip = async (zipInfo: DownloadableZipInfo, progressCallback?: ProgressCallback) => {
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
  const totalLength = Number(res.headers.get('Content-Length') as string);
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  let downloadedLength = 0;
  let chunks = [];
  while(true) {
    const {done, value} = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    downloadedLength += value.length;
    (progressCallback ?? function (_){})({
      progress: downloadedLength / totalLength,
      url: zipInfo.url
    });
  }
  let zipData = new Uint8Array(downloadedLength);
  let position = 0;
  for(let chunk of chunks) {
    zipData.set(chunk, position);
    position += chunk.length;
  }
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
