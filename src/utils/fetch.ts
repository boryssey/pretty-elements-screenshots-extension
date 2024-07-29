export type BaseFetchOptions = RequestInit & {
  url: string;
  timeout?: number;
  // responseType?: "text" | "dataUrl";
};

export function readBlob(blob: Blob, type: "dataUrl"): Promise<string>;
export function readBlob(blob: Blob, type: "arrayBuffer"): Promise<ArrayBuffer>;
export function readBlob(blob: Blob, type: "dataUrl" | "arrayBuffer") {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error(`Failed read blob to ${type}`));
    if (type === "dataUrl") {
      reader.readAsDataURL(blob);
    } else if (type === "arrayBuffer") {
      reader.readAsArrayBuffer(blob);
    }
  });
}
export const blobToDataUrl = (blob: Blob) => readBlob(blob, "dataUrl");

export async function baseFetch(options: BaseFetchOptions): Promise<string> {
  const {
    url,
    timeout,
    // responseType,
    ...requestInit
  } = options;

  const controller = new AbortController();

  const timer = timeout
    ? setTimeout(() => controller.abort(), timeout)
    : undefined;
  return fetch(url, { signal: controller.signal, ...requestInit })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed fetch, not 2xx response", { cause: response });
      }

      const blod = await response.blob();
      return blobToDataUrl(blod);
    })
    .catch((err) => {
      throw err;
    })
    .finally(() => clearTimeout(timer));
}
