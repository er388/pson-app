const handlers: (() => void)[] = [];

export const backStack = {
  push: (fn: () => void) => handlers.push(fn),
  pop: () => handlers.pop(),
  handle: (): boolean => {
    if (handlers.length > 0) {
      handlers[handlers.length - 1]();
      return true;
    }
    return false;
  },
};