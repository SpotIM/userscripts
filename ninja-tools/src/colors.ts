import * as prefs from './prefs';

export interface IColor {
  bg: string;
  border: string;
}

export const getUseDarkTheme = () => {
  const preferences = prefs.get();
  const { useDarkTheme } = preferences;
  return useDarkTheme;
};

const lightTheme = {
  default: { bg: '#467FDB', border: '#46abdb' },
  error: { bg: '#f44336', border: '#d81054' },
  success: { bg: '#4caf50', border: '#4dd052' },
};

const darkTheme = {
  default: { bg: '#121212', border: '#424242' },
  error: { bg: '#121212', border: '#424242' },
  success: { bg: '#121212', border: '#424242' },
};

const getColors = () => (getUseDarkTheme() ? darkTheme : lightTheme);

export default getColors;
