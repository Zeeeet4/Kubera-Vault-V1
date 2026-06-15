export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function preciseRound(num: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

export function preciseSum(arr: number[]): number {
  return arr.reduce((sum, val) => {
    return preciseRound(sum + (parseFloat(String(val)) || 0), 2);
  }, 0);
}

export function validatePositiveNumber(value: string | number, fieldName: string): number | null {
  const num = parseFloat(String(value));
  if (isNaN(num) || num < 0) {
    console.warn(`${fieldName} debe ser un número positivo`);
    return null;
  }
  return preciseRound(num, 2);
}

export function generateSiglas(title: string | null | undefined): string {
  if (!title) return '???';
  const words = title.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return title.substring(0, 3).toUpperCase();
  return words.slice(0, 3).map(w => (w[0] || '').toUpperCase()).join('');
}

export function generateAutoCode(entry?: { id?: number } | null): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = entry ? '01' : String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  return `${year}${month}-${seq}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatCurrency(amount: number, symbol = '$'): string {
  const preciseAmount = Math.round(Math.abs(amount) * 100) / 100;
  const formatted = preciseAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
