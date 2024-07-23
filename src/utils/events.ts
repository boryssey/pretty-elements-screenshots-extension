import browser from "webextension-polyfill";

interface FetchImageRequestPayload {
  url: string;
}

export class RequestError extends Error {
  constructor(
    message: string,
    public data: unknown,
  ) {
    super(message);
  }
}

interface FetchImageRequest {
  eventName: "makeRequest";
  payload: FetchImageRequestPayload;
}

export const isFetchImageRequest = (req: unknown): req is FetchImageRequest => {
  if (typeof req !== "object" || req === null) return false;
  if ("eventName" in req && req.eventName !== "fetchImage") return false;
  if (!("payload" in req) || !req.payload || typeof req.payload !== "object") {
    return false;
  }
  if (!("url" in req.payload) || typeof req.payload.url !== "string") {
    return false;
  }
  return true;
};

export const fetchImageHandler = async (
  request: FetchImageRequest,
): Promise<string> => {
  return fetch(request.payload.url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((callback) => {
          const reader = new FileReader();
          reader.onload = function () {
            callback(this.result as string);
          };
          reader.readAsDataURL(blob);
        }),
    );
};
export const sendFetchImageRequest = async (
  props: FetchImageRequestPayload,
): Promise<string> => {
  const res: unknown = await browser.runtime.sendMessage({
    eventName: "fetchImage",
    payload: props,
  });

  return res as string;
};

interface ScriptFinishedEvent {
  eventName: "scriptClosed";
  payload: {
    tabId: number;
  };
}

export const isScriptFinishedEvent = (
  req: unknown,
): req is ScriptFinishedEvent => {
  if (typeof req !== "object" || req === null) {
    return false;
  }
  if ("eventName" in req && req.eventName !== "scriptClosed") {
    return false;
  }
  if (!("payload" in req) || !req.payload || typeof req.payload !== "object") {
    return false;
  }
  if (!("tabId" in req.payload) || typeof req.payload.tabId !== "number") {
    return false;
  }

  return true;
};

export const sendScriptFinishedEvent = async (tabId: number) => {
  return browser.runtime.sendMessage({
    eventName: "scriptClosed",
    payload: { tabId },
  });
};

interface GetTabIdRequest {
  eventName: "getTabId";
}

export const isGetTabIdRequest = (req: unknown): req is GetTabIdRequest => {
  if (typeof req !== "object" || req === null) {
    return false;
  }
  if ("eventName" in req && req.eventName !== "getTabId") {
    return false;
  }
  return true;
};

export const sendGetTabIdRequest = async () => {
  return browser.runtime.sendMessage({
    eventName: "getTabId",
  });
};
