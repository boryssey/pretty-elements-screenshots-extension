import {
  CLASSNAME_PREFIX,
  closeScreenshotTool,
  getShadowHost,
  TOGGLED_CLASSNAME,
  TOGGLED_SELECTOR,
} from ".";
import { debounce } from "lodash";
import { domToCanvas } from "modern-screenshot";
import {
  defaultFetchInit,
  sendCaptureTabEvent,
  sendCheckPermissionsEvent,
  sendFetchImageRequest,
  sendShowOptionsRequest,
} from "@src/utils/events";
import FrameController, { CANVAS_ID } from "./FrameController";
import {
  createElementWithAttributes,
  createElementWithClassNames,
  createInfoMessageElement,
  sleep,
} from "@src/utils/helpers";
import { baseFetch } from "@src/utils/fetch";
// import browser from "webextension-polyfill";

export type ScreenshotMode = "element" | "page" | "area";

// const originalFetch = window.fetch;
// window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
//   console.log({ input, init }, "new Fetch");
//   return originalFetch(input, init);
// };

let selectedElement: HTMLElement | null = null;
let elementOverlay: HTMLElement | null = null;

let hasOptionalPermissions: boolean | undefined;

const checkPermissions = async () => {
  if (hasOptionalPermissions !== undefined) {
    return hasOptionalPermissions;
  }
  return sendCheckPermissionsEvent({
    origins: ["*://*/"],
  });
};
checkPermissions()
  .then((res) => {
    hasOptionalPermissions = res;
  })
  .catch((err) => console.error("error while checking permissions", err));

export const clearAllSelections = () => {
  if (selectedElement && elementOverlay) {
    selectedElement = null;
    buildSelectionOverlay();
  }
  const toggledElement = document.querySelectorAll(TOGGLED_SELECTOR);
  if (toggledElement.length) {
    toggledElement.forEach((element) => {
      element.classList.remove(TOGGLED_CLASSNAME);
    });
  }
};

const hideSelectionOverlay = () => {
  if (!elementOverlay) return;
  elementOverlay.style.display = "none";
};

const buildSelectionOverlay = () => {
  if (!elementOverlay) {
    const { shadowRoot } = getShadowHost();
    elementOverlay = shadowRoot.appendChild(
      createElementWithClassNames(
        "div",
        `${CLASSNAME_PREFIX}-selection-overlay`,
      ),
    );
  }
  if (!selectedElement) {
    hideSelectionOverlay();
    return;
  }
  const boundingRect = selectedElement.getBoundingClientRect();
  elementOverlay.style.top = `${boundingRect.top}px`;
  elementOverlay.style.left = `${boundingRect.left}px`;
  elementOverlay.style.height = `${boundingRect.height}px`;
  elementOverlay.style.width = `${boundingRect.width}px`;
};

document.addEventListener("scroll", () => {
  buildSelectionOverlay();
});

const handleMouseMoveEvent = debounce((e: Event) => {
  if (!(e instanceof MouseEvent)) return;
  const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
  if (!(elementAtPoint instanceof HTMLElement)) {
    return;
  }
  if (elementAtPoint !== selectedElement) {
    selectedElement = elementAtPoint;
  }
  buildSelectionOverlay();
}, 10);

const displayPermissionsWarning = () => {
  const { shadowRoot } = getShadowHost();
  const canvasElem = shadowRoot.getElementById(CANVAS_ID);
  console.log(canvasElem, "canvasElem");
  if (canvasElem) {
    const link = createElementWithAttributes("a", {
      target: "_blank",
    });
    link.innerText = "extension settings.";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      sendShowOptionsRequest().catch((err) =>
        console.error("error while opening options page", err),
      );
    });

    canvasElem.after(
      createInfoMessageElement(
        "There was an issue with loading images from the selected element. You may need to enable CORS in the ",
        link,
      ),
    );
  }
};

const fetchImage = async (url: string): Promise<string | false> => {
  try {
    if (!hasOptionalPermissions) {
      const res = await baseFetch({ url, ...defaultFetchInit }).catch(
        (error: Error) => {
          setTimeout(() => {
            displayPermissionsWarning();
          }, 100);
          console.error("caught fetch error", error.message);
          throw error;
        },
      );
      return res;
    }
    return sendFetchImageRequest({
      url,
    });
  } catch (err) {
    console.error("fetchImage error", err);
    return false;
  }
};

const transparentValues = ["rgba(0, 0, 0, 0)", "transparent"];

const getElementBackgroundColor = (element: HTMLElement) => {
  const backgroundColor = window.getComputedStyle(element).backgroundColor;

  if (!transparentValues.includes(backgroundColor)) {
    return backgroundColor;
  }
  if (!element.parentElement) {
    return "white";
  }
  return getElementBackgroundColor(element.parentElement);
};

const buildScreenshotOverlay = (screenshot: HTMLCanvasElement) => {
  const { shadowRoot } = getShadowHost();
  const overlay = shadowRoot.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-overlay`),
  );
  overlay.id = "pretty-screenshots-overlay";
  new FrameController(screenshot, overlay);

  overlay.addEventListener("click", (e) => {
    if ((e.target as Element).id !== "pretty-screenshots-overlay") {
      return;
    }
    closeScreenshotTool();
  });
};

const handleElementClick = (e: Event) => {
  if (!(e instanceof MouseEvent)) return;
  const { shadowHost } = getShadowHost();
  const asyncHandler = async () => {
    if (shadowHost.contains(e.target as Node)) {
      return;
    }
    e.preventDefault();
    console.log(selectedElement, "selected-element");
    if (!selectedElement || !(selectedElement instanceof HTMLElement)) {
      return;
    }
    hideSelectionOverlay();

    const screenshotCanvas = await domToCanvas(selectedElement, {
      backgroundColor: getElementBackgroundColor(selectedElement),
      fetchFn: fetchImage,
      scale: 2,
      onCloneNode: (node) => {
        if (!(node instanceof HTMLElement)) {
          return;
        }
        console.log(node, "node");

        node.style.marginBlockStart = "0px";
        node.style.marginBlockEnd = "0px";
        node.style.marginBlock = "0px";
        node.style.marginInlineStart = "0px";
        node.style.marginInlineEnd = "0px";
      },
    });
    document.removeEventListener("mousemove", handleMouseMoveEvent);
    document.removeEventListener("click", handleElementClick, {
      capture: true,
    });
    buildScreenshotOverlay(screenshotCanvas);
  };
  asyncHandler().catch((error) => console.error(error));
};

const loadImageFromDataUrl = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.src = url;
  });

export const capturePage = async () => {
  // console.log("🚀 ~ capturePage ~ screenshotDataUrl:", screenshotDataUrl);
  const screenshotCanvas = document.createElement("canvas");
  const ctx = screenshotCanvas.getContext("2d");
  // screenshotCanvas.height = document.body.clientHeight;
  // screenshotCanvas.width = document.body.clientWidth;
  if (!ctx) return;

  const body = document.body;
  const originalBodyOverflowYStyle = body ? body.style.overflowY : "";
  const originalX = window.scrollX;
  const originalY = window.scrollY;
  const originalOverflowStyle = document.documentElement.style.overflow;

  // try to make pages with bad scrolling work, e.g., ones with
  // `body { overflow-y: scroll; }` can break `window.scrollTo`
  if (body) {
    body.style.overflowY = "visible";
  }

  const widths = [
    document.documentElement.clientWidth,
    body ? body.scrollWidth : 0,
    document.documentElement.scrollWidth,
    body ? body.offsetWidth : 0,
    document.documentElement.offsetWidth,
  ];
  const heights = [
    document.documentElement.clientHeight,
    body ? body.scrollHeight : 0,
    document.documentElement.scrollHeight,
    body ? body.offsetHeight : 0,
    document.documentElement.offsetHeight,
  ];
  let fullWidth = Math.max(...widths);
  const fullHeight = Math.max(...heights);
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const topPadding = 200;
  const deltaY = windowHeight - (windowHeight > topPadding ? topPadding : 0);
  const deltaX = windowWidth;
  const positions = [];

  let yPos = fullHeight - windowHeight;
  let xPos;
  if (fullWidth <= deltaX + 1) {
    fullWidth = deltaX;
  }
  document.documentElement.style.overflow = "hidden";

  while (yPos > -deltaY) {
    xPos = 0;
    while (xPos < fullWidth) {
      positions.push([xPos, yPos]);
      xPos += deltaX;
    }
    yPos -= deltaY;
  }

  const dataUrls = [];
  const { shadowHost } = getShadowHost();
  shadowHost.style.display = "none";
  for (const [x, y] of positions) {
    window.scrollTo(x, y);
    await sleep(500);
    const dataUrl = await sendCaptureTabEvent();
    dataUrls.push({ dataUrl, x: window.scrollX, y: window.scrollY });
  }
  console.log(dataUrls, "dataUrls");
  await Promise.all(
    dataUrls.map(async ({ dataUrl, x, y }, index) => {
      const image = await loadImageFromDataUrl(dataUrl);
      let scaledWidth = fullWidth;
      let scaledHeight = fullHeight;
      let scaledWindowHeight = windowHeight;
      if (windowWidth !== image.width) {
        const scale = image.width / windowWidth;
        x *= scale;
        y *= scale;
        scaledWidth *= scale;
        scaledHeight *= scale;
        scaledWindowHeight *= scale;
      }
      if (screenshotCanvas.width !== scaledWidth) {
        console.log("update canvas size", screenshotCanvas.width, scaledWidth);
        screenshotCanvas.width = scaledWidth;
        screenshotCanvas.height = scaledHeight;
      }
      const top = index * scaledWindowHeight;

      console.log({ x, y, index, top, image, screenshotCanvas, resY: y - top });
      ctx.drawImage(image, x, y);
    }),
  );

  document.documentElement.style.overflow = originalOverflowStyle;
  if (body) {
    body.style.overflowY = originalBodyOverflowYStyle;
  }
  window.scrollTo(originalX, originalY);
  // const delay

  // await new Promise((r) => {
  //   img.onload = r;
  // });
  // img.src = screenshotDataUrl;
  shadowHost.style.display = "block";
  buildScreenshotOverlay(screenshotCanvas);
  clearMode();
};

const screenshotModeHandlers: Record<
  ScreenshotMode,
  Record<
    string,
    {
      handler: (e: Event) => void;
      options?: AddEventListenerOptions;
      target?: HTMLElement;
    }
  >
> = {
  element: {
    mousemove: { handler: handleMouseMoveEvent },
    click: { handler: handleElementClick, options: { capture: true } },
  },
  page: {
    mousemove: {
      handler: () => {
        console.log("mouseMoveHandler");
      },
    },
    click: {
      handler: () => {
        console.log("mouseClickHandler");
      },
    },
  },
  area: {
    mousemove: {
      handler: () => {
        console.log("mouseMoveHandler");
      },
    },
    click: {
      handler: () => {
        console.log("mouseMoveHandler");
      },
    },
  },
};

let currentScreenshotMode: ScreenshotMode = "element";

export const switchScreenshotMode = (mode: ScreenshotMode) => {
  const currentHandlers = screenshotModeHandlers[currentScreenshotMode];
  Object.entries(currentHandlers).forEach(
    ([eventName, { handler, options }]) => {
      document.removeEventListener(eventName, handler, options);
    },
  );
  const newEventHandlers = screenshotModeHandlers[mode];
  Object.entries(newEventHandlers).forEach(
    ([eventName, { handler, options, target }]) => {
      (target ?? document).addEventListener(eventName, handler, options);
    },
  );
  currentScreenshotMode = mode;
};

export const clearMode = () => {
  const currentHandlers = screenshotModeHandlers[currentScreenshotMode];
  Object.entries(currentHandlers).forEach(
    ([eventName, { handler, options }]) => {
      document.removeEventListener(eventName, handler, options);
    },
  );
};
