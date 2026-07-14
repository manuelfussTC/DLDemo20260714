export const extractionTimeoutMs = 30_000;
export const extractionTimeoutErrorMessage =
  "Die Aufgabenextraktion dauert zu lange. Bitte versuche es erneut.";

export class ExtractionTimeoutError extends Error {}

export async function withExtractionTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = extractionTimeoutMs,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      const error = new ExtractionTimeoutError(extractionTimeoutErrorMessage);
      reject(error);
      controller.abort(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(controller.signal), timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
