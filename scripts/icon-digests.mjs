// The connector and card dragon icons are the SDK's selected SAGA dragon files, used unchanged.
// Their digests are those recorded in the SDK's assets/brand/plugin/README.md; a replacement is a
// deliberate change to this table and to the SDK's, never an edit of the files here.
// `check-icons.mjs` checks the files on disk; the browser test checks the bytes inside the card.

export const ICON_DIGESTS = {
  'composer-icon-light.png':
    'b4bad3c7c3ff6baec188c69ac60f622c03c81b12d5aa6a4c9a4ca8f27c136912',
  'composer-icon-dark.png':
    '7609a165f30649cb6a06d5711da4b9e57918671b07bf9fbc9ec8f9a227969cab',
  'logo-light.png':
    '622ac01fb4ef89a81f8e17671bc8f299aabb1fd9c00439939bccbcd4ef685a1c',
  'logo-dark.png':
    '1c5d3adb66e8661fde7e3c37633fb459cca7eb19c0d1c2058271cda2ba08ca8e',
};
