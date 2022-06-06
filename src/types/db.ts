export interface ZipAsset {
  id?: number;
  key: string;
  name: string;
  packageName: string;
  data: Uint8Array;
  ctime: number;
}
