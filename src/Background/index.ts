import browser from "webextension-polyfill";
import { setStorageData } from '../utils/storage';

const allowedMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;


interface Message<T = any> {
  eventName: string;
  payload: T;
}

export type AxiosRequestMessage = Message<{
  method: typeof allowedMethods[number];
  url: string;
  data?: any;
  axiosConfig?: any;
}>

export const wrapAsyncFunction = (listener: (request: Message) => any | Promise<any>) => (request: any, sender: browser.Runtime.MessageSender, sendResponse: (response?: any) => void) => {
  // the listener(...) might return a non-promise result (not an async function), so we wrap it with Promise.resolve()
  Promise.resolve(listener(request))
    .then(data => sendResponse({ success: true, data }))
    .catch(error => {
      sendResponse({
        success: false,
        error: { message: error.message, status: error.response?.status, response: error.response?.data },
      });
    });
  return true as true; // return true to indicate you want to send a response asynchronously
};



console.log('background script running')