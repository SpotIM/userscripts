export const get = () => {
  return GM_getValue('prefs', {});
};

export const set = newPrefs => {
  return GM_setValue('prefs', { ...get(), ...newPrefs });
};
