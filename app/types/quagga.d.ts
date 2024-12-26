// types/quagga.d.ts

declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name?: string;
      type?: string;
      target?: HTMLElement | null;
      constraints?: {
        width?: number;
        height?: number;
        facingMode?: string;
      };
      area?: {
        top?: string;
        right?: string;
        left?: string;
        bottom?: string;
      };
    };
    decoder?: {
      readers?: string[];
      debug?: {
        drawBoundingBox?: boolean;
        showFrequency?: boolean;
        drawScanline?: boolean;
        showPattern?: boolean;
      };
    };
    locate?: boolean;
    numOfWorkers?: number;
    frequency?: number;
  }

  interface QuaggaResult {
    codeResult: {
      code: string;
      format: string;
    };
  }

  function init(config: QuaggaConfig, callback?: (err: any) => void): void;
  function start(): void;
  function stop(): void;
  function onDetected(callback: (result: QuaggaResult) => void): void;
  function offDetected(callback: (result: QuaggaResult) => void): void;
}
