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
    console.log("no payload");
    return false;
  }
  if (!("url" in req.payload) || typeof req.payload.url !== "string") {
    console.log("no url");
    return false;
  }
  return true;
};

export const fetchImageHandler = async (
  request: FetchImageRequest,
): Promise<string> => {
  //   if (!isFetchRequest(request)) throw new Error("Invalid request");
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
  console.log(res, "res");
  // const res = await fetch(props.url, {
  //   method: props.method.toUpperCase(),
  //   body: JSON.stringify(props.data),
  // })
  // if (!isAxiosResponse(res)) throw new RequestError("Invalid response", res);
  return res as string;
};
