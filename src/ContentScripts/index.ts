import { createElementWithClassNames } from "../utils/helpers";
import "./contentStyles.css";

import browser from "webextension-polyfill";
import { clearAllSelections, clearMode, switchScreenshotMode } from "./modes";
import { sendGetTabIdRequest, sendScriptFinishedEvent } from "../utils/events";

export const CLASSNAME_PREFIX = "__pretty_screenshots";

export const TOGGLED_CLASSNAME = `${CLASSNAME_PREFIX}-selected`;
export const TOGGLED_SELECTOR = `.${TOGGLED_CLASSNAME}`;

const logger = (args?: unknown, ...optionalParams: unknown[]) => {
  console.log("[CSC]:", args, optionalParams);
};

logger("content script called");

let tabId: number;

sendGetTabIdRequest()
  .then((id) => {
    logger("Got tab id", id);
    if (!id || typeof id !== "number") return;
    tabId = id;
  })
  .catch((error) => console.error("Error getting tab id", error));

const createShadowRoot = () => {
  const shadowHost = document.createElement("div");
  shadowHost.id = `${CLASSNAME_PREFIX}-container`;
  document.body.appendChild(shadowHost);
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });
  const url = browser.runtime.getURL("contentStyles.css");
  shadowRoot.innerHTML = `
   <style>
    @import url("${url}");
    </style>
  `;
  return { shadowHost, shadowRoot };
};

const { shadowHost, shadowRoot } = createShadowRoot();

export const getShadowHost = () => {
  return { shadowHost, shadowRoot };
};

const buildScreenshotModeToolbar = () => {
  if (!shadowRoot) {
    return;
  }

  const createButton = (text: string, handler: (e: MouseEvent) => void) => {
    const button = createElementWithClassNames(
      "button",
      `${CLASSNAME_PREFIX}-toolbar-button`,
    );
    button.textContent = text;
    button.addEventListener("click", handler);
    return button;
  };

  const toolbar = shadowRoot.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-toolbar`),
  );
  toolbar.appendChild(
    createButton("Element", () => switchScreenshotMode("element")),
  );
  toolbar.appendChild(createButton("Page", () => switchScreenshotMode("page")));
  toolbar.appendChild(createButton("Area", () => switchScreenshotMode("area")));
  toolbar.appendChild(createButton("Cancel", () => close()));
};

buildScreenshotModeToolbar();

switchScreenshotMode("element");

export const close = () => {
  clearAllSelections();
  clearMode();
  shadowHost.remove();
  tabId &&
    sendScriptFinishedEvent(tabId)
      .then(() => logger("script closed"))
      .catch((error) => console.error("Error sending close event", error));
};

const handleEscapeKey = (e: KeyboardEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.key === "Escape") {
    close();
    document.removeEventListener("keydown", handleEscapeKey, {
      capture: true,
    });
  }
};

document.addEventListener("keydown", handleEscapeKey, {
  capture: true,
});

/*
TODO:

Implement full page, select area mode.
Right bar with options for created screenshot:border size, border color, shadow size, shadow color. 
Save options: name, format, quality, download button.
Request persmission for CORS 

DONE:
lower bar with button for whole page, select element, (select area).  DONE
Invoke script on click on extension icon. DONE
clean up on cancel or ESC button DONE
Copy as image. DONE
Right bar with options for created screenshot: padding size DONE, padding color DONE, border-radius DONE, 

*/
