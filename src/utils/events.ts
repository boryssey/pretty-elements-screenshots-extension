import browser, { Permissions } from "webextension-polyfill";
import { baseFetch } from "./fetch";

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

function hasEventName<T extends string>(
  req: unknown,
  eventName: T,
): req is { eventName: T } {
  return (
    typeof req === "object" &&
    req !== null &&
    "eventName" in req &&
    req.eventName === eventName
  );
}

export const isFetchImageRequest = (req: unknown): req is FetchImageRequest => {
  if (!hasEventName(req, "makeRequest")) return false;
  if (!("payload" in req) || !req.payload || typeof req.payload !== "object") {
    return false;
  }
  if (!("url" in req.payload) || typeof req.payload.url !== "string") {
    return false;
  }
  return true;
};

export const defaultFetchInit: RequestInit = {
  cache: "force-cache",
  headers: {
    accept: `${["image/webp", "image/svg+xml", "image/*", "*/*"].join(
      ",",
    )};q=0.8`,
  },
};

export const fetchImageHandler = async (
  request: FetchImageRequest,
): Promise<string> => {
  return baseFetch({ url: request.payload.url, ...defaultFetchInit });
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
  if (!hasEventName(req, "scriptClosed")) return false;
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
  if (!hasEventName(req, "getTabId")) return false;
  return true;
};

export const sendGetTabIdRequest = async () => {
  return browser.runtime.sendMessage({
    eventName: "getTabId",
  });
};

interface CheckPermissionsEvent {
  eventName: "checkPermissions";
  payload: {
    origins: string[];
  };
}

export const isCheckPermissionsEvent = (
  request: unknown,
): request is CheckPermissionsEvent => {
  if (!hasEventName(request, "checkPermissions")) return false;
  if (
    !("payload" in request) ||
    !request.payload ||
    typeof request.payload !== "object"
  ) {
    return false;
  }
  if (
    !("origins" in request.payload) ||
    !Array.isArray(request.payload.origins)
  ) {
    return false;
  }
  return true;
};

export const sendCheckPermissionsEvent = async (
  props: CheckPermissionsEvent["payload"],
): Promise<boolean> => {
  const res: unknown = await browser.runtime.sendMessage({
    eventName: "checkPermissions",
    payload: props,
  });

  return res as boolean;
};

interface GetPermissionsRequest {
  eventName: "getPermissions";
  payload: Permissions.Permissions;
}

export const isGetPermissionsRequest = (
  request: unknown,
): request is GetPermissionsRequest => {
  if (!hasEventName(request, "getPermissions")) return false;
  if (
    !("payload" in request) ||
    !request.payload ||
    typeof request.payload !== "object"
  ) {
    return false;
  }
  if (
    (!("origins" in request.payload) ||
      !Array.isArray(request.payload.origins)) &&
    (!("permissions" in request.payload) ||
      !Array.isArray(request.payload.permissions))
  ) {
    return false;
  }
  return true;
};

export const sendGetPermissionsRequest = async (
  props: GetPermissionsRequest["payload"],
): Promise<boolean> => {
  const res: unknown = await browser.runtime.sendMessage({
    eventName: "getPermissions",
    payload: props,
  });

  return res as boolean;
};

interface ShowOptionsRequest {
  eventName: "showOptions";
}

export const isShowOptionsRequest = (
  request: unknown,
): request is ShowOptionsRequest => {
  if (!hasEventName(request, "showOptions")) return false;
  return true;
};

export const sendShowOptionsRequest = async () => {
  return browser.runtime.sendMessage({
    eventName: "showOptions",
  });
};

interface CaptureTabEvent {
  eventName: "captureTab";
}

export const isCaptureTabEvent = (req: unknown): req is CaptureTabEvent => {
  if (!hasEventName(req, "captureTab")) return false;
  return true;
};

export const sendCaptureTabEvent = async (): Promise<string> => {
  return browser.runtime.sendMessage({
    eventName: "captureTab",
  }) as Promise<string>;
};
