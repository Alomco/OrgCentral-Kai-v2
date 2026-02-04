const BAILOUT_MESSAGE_SNIPPETS = [
  'needs to bail out of prerendering',
  'NEXT_DYNAMIC_SERVER_USAGE',
  'Dynamic server usage',
];

export function throwIfNextPrerenderBailout(error: unknown): void {
  if (!(error instanceof Error)) {
    return;
  }

  const shouldThrow = BAILOUT_MESSAGE_SNIPPETS.some((snippet) =>
    error.message.includes(snippet),
  );

  if (shouldThrow) {
    throw error;
  }
}
