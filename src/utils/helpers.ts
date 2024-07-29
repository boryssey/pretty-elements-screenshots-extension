import { CLASSNAME_PREFIX } from "@src/ContentScripts";

export const createElementWithClassNames = (
  tagName: string,
  ...className: string[]
) => {
  const newElement = document.createElement(tagName);

  newElement.classList.add(...className);
  return newElement;
};

export const createElementWithAttributes = (
  tagName: string,
  attributes?: Record<string, string> | null,
  ...className: string[]
) => {
  const newElement = document.createElement(tagName);

  attributes &&
    Object.entries(attributes).forEach(([key, value]) => {
      newElement.setAttribute(key, value);
    });

  newElement.classList.add(...className);

  return newElement;
};

/*
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.00098 3.08545H7.99897L2.32397 13.9984L2.32547 13.9999H13.6745L13.6755 13.9984L8.00098 3.08545ZM7.43747 5.99995H8.56247V10.4999H7.43747V5.99995ZM7.99997 12.9999C7.85164 12.9999 7.70663 12.956 7.5833 12.8736C7.45996 12.7911 7.36383 12.674 7.30707 12.537C7.2503 12.3999 7.23545 12.2491 7.26439 12.1036C7.29332 11.9581 7.36476 11.8245 7.46964 11.7196C7.57453 11.6147 7.70817 11.5433 7.85366 11.5144C7.99914 11.4854 8.14994 11.5003 8.28699 11.557C8.42403 11.6138 8.54117 11.7099 8.62358 11.8333C8.70599 11.9566 8.74997 12.1016 8.74997 12.2499C8.74997 12.4489 8.67096 12.6396 8.5303 12.7803C8.38965 12.9209 8.19889 12.9999 7.99997 12.9999Z" fill="#EED202"/>
<path d="M14.5 15H1.50004C1.41418 14.9999 1.32977 14.9778 1.25494 14.9357C1.18012 14.8935 1.11741 14.8329 1.07285 14.7595C1.02828 14.6861 1.00338 14.6024 1.00052 14.5166C0.997665 14.4308 1.01696 14.3457 1.05654 14.2695L7.55654 1.76948C7.59878 1.68835 7.66246 1.62036 7.74066 1.57291C7.81886 1.52546 7.90858 1.50037 8.00004 1.50037C8.09151 1.50037 8.18123 1.52546 8.25943 1.57291C8.33762 1.62036 8.40131 1.68835 8.44354 1.76948L14.9435 14.2695C14.9831 14.3457 15.0024 14.4308 14.9996 14.5166C14.9967 14.6024 14.9718 14.6861 14.9272 14.7595C14.8827 14.8329 14.82 14.8935 14.7451 14.9357C14.6703 14.9778 14.5859 14.9999 14.5 15ZM2.32504 14H13.675L13.6755 13.9985L8.00104 3.08498H7.99904L2.32404 13.9985L2.32504 14Z" fill="#EED202"/>
</svg>

*/

export const createWarningSvg = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");

  svg.innerHTML = `
    <path d="M8.00098 3.08545H7.99897L2.32397 13.9984L2.32547 13.9999H13.6745L13.6755 13.9984L8.00098 3.08545ZM7.43747 5.99995H8.56247V10.4999H7.43747V5.99995ZM7.99997 12.9999C7.85164 12.9999 7.70663 12.956 7.5833 12.8736C7.45996 12.7911 7.36383 12.674 7.30707 12.537C7.2503 12.3999 7.23545 12.2491 7.26439 12.1036C7.29332 11.9581 7.36476 11.8245 7.46964 11.7196C7.57453 11.6147 7.70817 11.5433 7.85366 11.5144C7.99914 11.4854 8.14994 11.5003 8.28699 11.557C8.42403 11.6138 8.54117 11.7099 8.62358 11.8333C8.70599 11.9566 8.74997 12.1016 8.74997 12.2499C8.74997 12.4489 8.67096 12.6396 8.5303 12.7803C8.38965 12.9209 8.19889 12.9999 7.99997 12.9999Z" fill="#EED202"></path>
    <path d="M14.5 15H1.50004C1.41418 14.9999 1.32977 14.9778 1.25494 14.9357C1.18012 14.8935 1.11741 14.8329 1.07285 14.7595C1.02828 14.6861 1.00338 14.6024 1.00052 14.5166C0.997665 14.4308 1.01696 14.3457 1.05654 14.2695L7.55654 1.76948C7.59878 1.68835 7.66246 1.62036 7.74066 1.57291C7.81886 1.52546 7.90858 1.50037 8.00004 1.50037C8.09151 1.50037 8.18123 1.52546 8.25943 1.57291C8.33762 1.62036 8.40131 1.68835 8.44354 1.76948L14.9435 14.2695C14.9831 14.3457 15.0024 14.4308 14.9996 14.5166C14.9967 14.6024 14.9718 14.6861 14.9272 14.7595C14.8827 14.8329 14.82 14.8935 14.7451 14.9357C14.6703 14.9778 14.5859 14.9999 14.5 15ZM2.32504 14H13.675L13.6755 13.9985L8.00104 3.08498H7.99904L2.32404 13.9985L2.32504 14Z" fill="#EED202"></path>
  `;
  return svg;
};

export const createInfoMessageElement = (...children: (Node | string)[]) => {
  const infoMessage = createElementWithClassNames(
    "div",
    `${CLASSNAME_PREFIX}-info-message`,
  );

  infoMessage.appendChild(createWarningSvg());
  children.forEach((child) => {
    if (typeof child === "string") {
      infoMessage.appendChild(document.createTextNode(child));
      return;
    }
    infoMessage.appendChild(child);
  });
  return infoMessage;
};

export const downloadCanvas = (canvas: HTMLCanvasElement) => {
  const link = document.createElement("a");
  link.download = "screenshot.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};

export const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
