const { notarize } = require('@electron/notarize');
const { build } = require('../../package.json');

exports.default = async function notarizeMacos(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  // can uncomment after we have CI set up
  // if (process.env.CI !== 'true') {
  //   console.warn('Skipping notarizing step. Packaging is not running in CI');
  //   return;
  // }

  if (
    !(
      'APPLE_ID' in process.env &&
      'APPLE_APP_SPECIFIC_PASSWORD' in process.env &&
      'APPLE_TEAM_ID' in process.env
    )
  ) {
    console.warn(
      'Skipping notarizing step. APPLE_ID and APPLE_ID_PASS env variables must be set'
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  // const version = context.packager.appInfo.version;
  await notarize({
    appBundleId: build.appId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });

  console.log('Notarization script finished');
};
