self.$RefreshReg$ = () => {};
self.$RefreshSig$ = () => () => {};
const querystring = require('querystring');

const logger = msg => {
  console.log(`[BGC] ${msg}`);
};

logger('background client up.');

logger('connecting to SSE service...');
console.log(__resourceQuery, '__resourceQuery')
const port = querystring.parse(__resourceQuery.slice(1)).port;
const es = new EventSource(`http://localhost:${port}/__server_sent_events__`);

es.addEventListener(
  'open',
  () => {
    logger('SSE service connected!');
  },
  false
);

es.addEventListener(
  'error',
  event => {
    if (event.target.readyState === 0) {
      console.error('[BGC] you need to open devServer first!');
    } else {
      console.error(event);
    }
  },
  false
);

es.addEventListener('background-updated', () => {
  logger("received 'background-updated' event from SSE service.");
  logger('extension will reload to reload background...');
  setTimeout(() => {
    // chrome.runtime.reload(); 
  }, 5000)
  // reload extension to reload background.
});

es.addEventListener(
  'content-scripts-updated',
  () => {
    logger("received 'content-scripts-updated' event from SSE service.");
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            from: 'backgroundClient',
            action: 'reload-yourself',
          },
          res => {
            if (chrome.runtime.lastError && !res) return;

            const {from, action} = res;
            if (from === 'contentScriptClient' && action === 'yes-sir') {
              es.close();
              logger('extension will reload to update content scripts...');
              chrome.runtime.reload();
            }
          }
        );
      });
    });
  },
  false
);
