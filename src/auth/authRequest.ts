const DEFAULT_AUTH_TIMEOUT_MS = 15_000;

export async function withAuthTimeout<T>(
  request: PromiseLike<T>,
  timeoutMs = DEFAULT_AUTH_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('پاسخ سرور ورود بیش از حد طول کشید. دوباره تلاش کنید.'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(request), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
