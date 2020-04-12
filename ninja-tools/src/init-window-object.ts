import * as hostPanel from './host-panel';

export default () => {
  unsafeWindow.__spotimninjatools = {
    updateCredentials: () => {
      hostPanel.openCredentialsForm();
    },
  };
};
