import { createLogger, fileURLToPath } from '@aztec/aztec.js';
import { startPXEHttpServer } from '@aztec/pxe';

import Koa from 'koa';
import serve from 'koa-static';
import path, { dirname } from 'path';

import { setup } from '../fixtures/utils.js';
import { browserTestSuite } from '../shared/browser.js';

const { PXE_URL = '' } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 4000;
const PXE_PORT = 4001;

const logger = createLogger('e2e:aztec_browser.js:web');
const pageLogger = createLogger('e2e:aztec_browser.js:web:page');

/**
 * This test is a bit of a special case as it's on a web browser and not only on anvil and node.js.
 * To run the test on mainframe, do the following:
 *    1) Build the whole repository,
 *    2) If playwright is not installed, install it with `sudo npx playwright install`,
 *    3) start anvil: `anvil`,
 *    4) start sandbox in another terminal: `cd yarn-project/aztec && yarn start:sandbox`,
 *    5) go to `yarn-project/end-to-end` and build the web packed package with `yarn build:web`,
 *    6) put your username in the path and run: `export CHROME_BIN="/mnt/user-data/USER_NAME/.cache/ms-playwright/chromium-1091/chrome-linux/chrome"`
 *    7) open new terminal and run `export ETHEREUM_HOST='http://localhost:8545/' && export PXE_URL='http://localhost:8080'`
 *    8) go to `yarn-project/end-to-end` and run the test: `LOG_LEVEL=debug yarn test:e2e e2e_aztec_js_browser`
 *
 * Note 1: if you get browser executable not found error check the path from step 6 and fix it if necessary (browser version might have changed),
 * Note 2: If you get dependency error run `apt install libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libxdamage1 libxkbcommon0 libpango-1.0-0 libcairo2 libasound2t64`.
 * Note 3: If you see the logs spammed with unexpected logs there is probably a chrome process with a webpage
 *         unexpectedly running in the background. Kill it with `killall chrome`
 * Note 4: Don't forget to run `yarn build:web` once you make changes!
 * Note 5: The test serializes token contract artifact to and from buffer. If you introduce a new type in the artifact
 *         you have to register it on `TypeRegistry` class, implement fromJSON method just like TypeRegistry requires
 *         and add a case in `contractArtifactFromBuffer(...)` function.
 */
const setupApp = async () => {
  const { pxe: pxeService } = await setup(0);
  let pxeURL = PXE_URL;
  let pxeServer = undefined;
  if (!PXE_URL) {
    pxeServer = startPXEHttpServer(pxeService, PXE_PORT);
    pxeURL = `http://localhost:${PXE_PORT}`;
  }

  const app = new Koa();
  app.use(async (ctx, next) => {
    if (ctx.url.endsWith('.gz')) {
      ctx.set('Content-Encoding', 'gzip');
      ctx.res.removeHeader('Content-Length');
    }
    await next();
  });
  app.use(serve(path.resolve(__dirname, '../web')));
  const server = app.listen(PORT, () => {
    logger.info(`Web Server started at http://localhost:${PORT}`);
  });

  return { server, webServerURL: `http://localhost:${PORT}`, pxeServer, pxeURL };
};

browserTestSuite(setupApp, pageLogger);
