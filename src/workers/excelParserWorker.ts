import { parseExcelWorkbook } from '../utils/excelParser';

// Worker message event handler
self.onmessage = async (e: MessageEvent<{ buffer: ArrayBuffer; fileName: string; fileSize: number }>) => {
  const { buffer, fileName, fileSize } = e.data;
  try {
    const workbook = await parseExcelWorkbook(buffer, fileName, fileSize);
    self.postMessage({
      type: 'SUCCESS',
      workbook,
    });
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      error: error?.message || 'Failed to parse Excel workbook in worker thread',
    });
  }
};
