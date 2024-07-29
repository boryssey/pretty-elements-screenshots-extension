import {
  fetchImageHandler,
  isCaptureTabEvent,
  isCheckPermissionsEvent,
  isFetchImageRequest,
  isGetPermissionsRequest,
  isGetTabIdRequest,
  isScriptFinishedEvent,
  isShowOptionsRequest,
} from "@src/utils/events";
import { addStorageValueListener } from "@src/utils/storage";
import browser from "webextension-polyfill";

const allowedMethods = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
] as const;

export interface Message<T = unknown> {
  eventName: string;
  payload: T;
}

export type AxiosRequestMessage = Message<{
  method: (typeof allowedMethods)[number];
  url: string;
  data?: unknown;
  axiosConfig?: unknown;
}>;

browser.runtime.onMessage.addListener(
  async (request: unknown, _sender: browser.Runtime.MessageSender) => {
    console.log({ request }, "background message");
    switch (true) {
      case isFetchImageRequest(request): {
        return fetchImageHandler(request);
      }
      case isScriptFinishedEvent(request): {
        const { tabId } = request.payload;
        runningScripts[tabId] = false;
        console.log({ runningScripts }, "script finished");
        return Promise.resolve();
      }
      case isGetTabIdRequest(request): {
        return Promise.resolve(_sender.tab?.id);
      }
      case isCheckPermissionsEvent(request): {
        return browser.permissions.contains(request.payload);
      }
      case isGetPermissionsRequest(request): {
        return browser.permissions.request(request.payload);
      }
      case isShowOptionsRequest(request): {
        return browser.runtime.openOptionsPage();
      }
      case isCaptureTabEvent(request): {
        return browser.tabs.captureVisibleTab();
      }
      default: {
        return Promise.reject(new Error("Invalid request"));
      }
    }
  },
);

const runningScripts: Record<number, boolean> = {};

const executeScriptOnTabId = (tabId: number) => {
  if (runningScripts[tabId]) {
    console.warn("Script already running on tab", tabId);
    return;
  }
  browser.scripting
    .executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    })
    .then(() => {
      // runningScripts[tabId] = true;
      console.log({ runningScripts }, "executed script");
    })
    .catch((err) => {
      console.error("Error executing script", err);
    });
};

browser.contextMenus.create({
  contexts: ["page"],
  title: "Take screenshot",
  id: "take-screenshot",
});

browser.contextMenus.onClicked.addListener((_, tab) => {
  const tabId = tab?.id;
  if (!tabId) {
    return;
  }
  executeScriptOnTabId(tabId);
});

browser.action.onClicked.addListener((tab) => {
  const tabId = tab.id;
  if (!tabId) {
    return;
  }
  executeScriptOnTabId(tabId);
});

console.log("background script running");

addStorageValueListener("frameOptions.borderRadius", (newValue) => {
  console.log(newValue, "borderRadius");
});
addStorageValueListener("frameOptions.padding", (newValue) => {
  console.log(newValue, "padding");
});
addStorageValueListener("frameOptions.frameColor", (newValue) => {
  console.log(newValue, "color");
});
