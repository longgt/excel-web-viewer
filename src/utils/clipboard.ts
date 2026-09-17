/**
 * Copies text to clipboard with modern navigator.clipboard and fallback for iframe sandboxes
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const normalizedText = text === null || text === undefined ? '' : String(text);

  // 1. Try modern Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(normalizedText);
      return true;
    } catch {
      // Fallback below
    }
  }

  // 2. Reliable fallback using hidden textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = normalizedText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
