export interface ZipAsset {
  id?: number;
  key: string;
  name: string;
  bundleName: string;
  data: Uint8Array;
  version: number;
  createTime: number;
}

export interface ZipMeta {
  id?: number;
  bundleName: string;
  downloadTime: number;
  version: number;
  hash: string;
}
