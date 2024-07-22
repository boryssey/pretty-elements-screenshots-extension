import { fetchImageHandler, isFetchImageRequest } from "../utils/makeRequest";
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

// export const wrapAsyncFunction =
//   (listener: (request: Message) => Promise<unknown>) =>
//   (
//     request: unknown,
//     _sender: browser.Runtime.MessageSender,
//     sendResponse: (response?: unknown) => void,
//   ) => {
//     // the listener(...) might return a non-promise result (not an async function), so we wrap it with Promise.resolve()
//     Promise.resolve(listener(request))
//       .then((data) => sendResponse({ success: true, data }))
//       .catch((error: unknown) => {
//         sendResponse({
//           success: false,
//           error: {
//             message: error.message,
//             status: error.response?.status,
//             response: error.response?.data,
//           },
//         });
//       });
//     return true as const; // return true to indicate you want to send a response asynchronously
//   };

browser.runtime.onMessage.addListener(
  async (request: unknown, _sender: browser.Runtime.MessageSender) => {
    console.log(request, "request");
    if (isFetchImageRequest(request)) {
      console.log("fetchImageHandler");
      return fetchImageHandler(request);
    } else {
      return Promise.reject(new Error("Invalid request"));
    }
  },
);

console.log("background script running");
