export interface ProgressCallbackOpt {
  progress: number,
  url: string,
}

export type ProgressCallback = (data: ProgressCallbackOpt) => void
