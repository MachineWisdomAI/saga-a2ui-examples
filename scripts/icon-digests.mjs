// The connector and card dragon icons are the SDK's operator-selected second edition of the saga
// dragon artwork, used unchanged: head crops for the composer icons (128 px, transparent) and the
// full mark on a solid tile for the logos (512 px). Their digests are those recorded in the SDK's
// assets/brand/plugin/README.md; a replacement is a deliberate change to this table and to the
// SDK's, never an edit of the files here.
// `check-icons.mjs` checks the files on disk; the browser test checks the bytes inside the card.

export const ICON_DIGESTS = {
  'composer-icon-light.png':
    '59b21877707e9f3ae59c47ea5a00bed4938a0c7a99903a555155f06b6ae61a2d',
  'composer-icon-dark.png':
    '87f6878befdebe02ef954dbd2c92a47c0a84f803033ae0da279f031d93ea7013',
  'logo-light.png':
    '66f444d50e29b7317bbf0a0743fa08630239e7f2e17f022d25dc042e01c7e95c',
  'logo-dark.png':
    '3dab20a89fd8318abab9b83ab6490162ab5ccc4d0157a37d2af3afbd4e59c07c',
};
