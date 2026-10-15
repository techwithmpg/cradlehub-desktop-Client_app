type InFlightOperation<T> = Promise<T>;

const inFlightOperations = new Map<string, InFlightOperation<unknown>>();

function removeIfCurrent<T>(key: string, request: Promise<T>): void {
  if (inFlightOperations.get(key) === request) {
    inFlightOperations.delete(key);
  }
}

export function singleFlight<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const existing = inFlightOperations.get(key);

  if (existing) {
    return existing as Promise<T>;
  }

  let request: Promise<T>;

  try {
    request = Promise.resolve(operation());
  } catch (error) {
    return Promise.reject(error);
  }

  inFlightOperations.set(key, request);

  void request.then(
    () => {
      removeIfCurrent(key, request);
    },
    () => {
      removeIfCurrent(key, request);
    },
  );

  return request;
}

export function getInFlightOperationCount(): number {
  return inFlightOperations.size;
}

export function clearInFlightOperationsForTests(): void {
  inFlightOperations.clear();
}
