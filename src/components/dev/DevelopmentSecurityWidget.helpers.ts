export const TOAST_LONG_MS = 1500;
export const TOAST_SHORT_MS = 1200;
export const DEBUG_TITLE = "Dev security widget";

export function truncateId(value: string | null | undefined, head = 8, tail = 4): string {
  if (!value) {
    return "-";
  }
  if (value.length <= head + tail + 3) {
    return value;
  }
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
