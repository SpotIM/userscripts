import * as prefs from './prefs';

export default () => {
  unsafeWindow.__spotim_ninja_tools_set_creds__ = async (email, password) => {
    await GM_setValue('email', email);
    await GM_setValue('password', password);
    console.log('successfully set creds!');
  };

  unsafeWindow.__spotim_ninja_tools_set_prefs__ = async newPrefs => {
    const currentPrefs = prefs.get();

    const mergedPrefs = {
      ...currentPrefs,
      ...newPrefs,
    };
    await prefs.set(mergedPrefs);

    console.log('successfully set prefs!');
    console.log(mergedPrefs);
  };
};
