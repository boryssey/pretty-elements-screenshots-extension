import browser from "webextension-polyfill";

export function getStorageData<T extends string>(
  key: T,
): Promise<{ [key in T]?: string }> {
  return browser.storage.local.get(key) as Promise<{ [key in T]?: string }>;
}

export const setStorageData = (data: Record<string, unknown>) =>
  browser.storage.local.set(data);

export const addStorageValueListener = (
  key: string,
  listener: (value: unknown) => void | Promise<void>,
) =>
  browser.storage.local.onChanged.addListener((changes) => {
    if (changes[key]) {
      const newValue = changes[key].newValue as unknown;
      newValue && listener(changes[key].newValue);
    }
  });
