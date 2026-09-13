import { WorkbookData } from '../types';
import { parseExcelWorkbook } from './excelParser';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export function validateFileSize(sizeInBytes: number): { valid: boolean; error?: string } {
  if (sizeInBytes > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size exceeds the 10MB maximum limit (uploaded file is ${sizeInMB} MB). Please upload a file under 10MB.`,
    };
  }
  return { valid: true };
}

export function parseExcelInBackground(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<WorkbookData> {
  return new Promise((resolve, reject) => {
    // Check if Web Worker is supported in the current environment
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../workers/excelParserWorker.ts', import.meta.url),
          { type: 'module' }
        );

        let isCompleted = false;

        worker.onmessage = (event: MessageEvent) => {
          isCompleted = true;
          worker.terminate();

          if (event.data.type === 'SUCCESS') {
            resolve(event.data.workbook);
          } else {
            reject(new Error(event.data.error || 'Failed to parse Excel file in background'));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          if (!isCompleted) {
            console.warn('Worker encountered an error, falling back to local thread parsing:', err);
            try {
              const fallbackResult = parseExcelWorkbook(buffer, fileName, fileSize);
              resolve(fallbackResult);
            } catch (fallbackError) {
              reject(fallbackError);
            }
          }
        };

        // Transfer the ArrayBuffer to the worker to avoid memory duplication
        // Note: if transfer fails in certain browsers, standard message passing works
        try {
          worker.postMessage({ buffer, fileName, fileSize }, [buffer]);
        } catch {
          worker.postMessage({ buffer, fileName, fileSize });
        }

        return;
      } catch (err) {
        console.warn('Could not instantiate Web Worker, using main thread fallback:', err);
      }
    }

    // Fallback if Worker is not available
    try {
      const result = parseExcelWorkbook(buffer, fileName, fileSize);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}
