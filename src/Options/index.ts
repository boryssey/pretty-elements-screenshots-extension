import browser from "webextension-polyfill";

const getInitialPermissionValue = async () => {
  return browser.permissions.contains({
    origins: ["*://*/"],
  });
};

const checkbox = document.getElementById("cors_checkbox") as HTMLInputElement;
console.log("🚀 ~ checkbox:", checkbox);

getInitialPermissionValue()
  .then((res) => {
    if (res) {
      checkbox.checked = true;
    }
  })
  .catch((err) => {
    console.error("error while checking permissions", err);
  });

checkbox.addEventListener("change", (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    browser.permissions
      .request({
        origins: ["*://*/"],
      })
      .then((res) => {
        checkbox.checked = res;
      })
      .catch((err) => {
        console.error("error while requesting permissions", err);
      });
    return;
  } else {
    browser.permissions
      .remove({
        origins: ["*://*/"],
      })
      .then((res) => {
        checkbox.checked = !res;
      })
      .catch((err) => {
        console.error("error while removing permissions", err);
      });
  }
});
