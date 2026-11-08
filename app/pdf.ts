import type { Book, Chapter } from './book';

export async function importPdf(file: File, onProgress?: (done: number, total: number) => void): Promise<Book> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
  const task = pdfjs.getDocument({data: new Uint8Array(await file.arrayBuffer())});
  try {
    const doc = await task.promise;
    const chapters: Chapter[] = [];
    let hasText = false;
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let line = '';
      let lastY: number | undefined;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const y = item.transform[5];
        if (lastY !== undefined && Math.abs(y - lastY) > Math.max(3, item.height * 0.5) && line.trim()) {
          lines.push(line.trim()); line = '';
        }
        line += item.str;
        if (item.str && !/\s$/.test(item.str)) line += ' ';
        lastY = y;
        if (item.hasEOL) { if (line.trim()) lines.push(line.trim()); line = ''; lastY = undefined; }
      }
      if (line.trim()) lines.push(line.trim());
      const text = lines.join('\n').replace(/([A-Za-z])-\n(?=[a-z])/g, '$1').trim();
      if (text) hasText = true;
      chapters.push({title: `Страница ${n}`, paragraphs: text ? [text.replace(/\n/g, ' ')] : []});
      page.cleanup();
      onProgress?.(n, doc.numPages);
    }
    if (!hasText) throw new Error('В PDF нет текстового слоя. Это скан: сначала распознайте текст (OCR), затем загрузите PDF снова.');
    const metadata = await doc.getMetadata().catch(() => null);
    const info = metadata?.info as {Title?: string; Author?: string} | undefined;
    return {id: crypto.randomUUID(), format: 'pdf', title: info?.Title?.trim() || file.name.replace(/\.pdf$/i, ''), author: info?.Author?.trim() || 'Моя книга', chapters, page: 0, added: Date.now()};
  } catch (e) {
    if (e instanceof Error && e.name === 'PasswordException') throw new Error('PDF защищён паролем. Загрузите копию без пароля.');
    if (e instanceof Error && ['InvalidPDFException', 'MissingPDFException'].includes(e.name)) throw new Error('Не удалось прочитать PDF. Файл повреждён или имеет неверный формат.');
    throw e;
  } finally { await task.destroy(); }
}
