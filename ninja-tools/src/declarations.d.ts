type TValueChangeListener = (
  name: string,
  oldValue: any,
  newValue: any,
  remote: boolean
) => void;

declare const GM_notification: (options: any) => void;
declare const GM_setClipboard: (content: string) => void;
declare const GM_getValue: (key: string, defaultValue?: any) => any;
declare const GM_setValue: (key: string, value: any) => void;
declare const GM_openInTab: (url: string, background: boolean) => void;
declare const GM_getResourceURL: (name: string) => string;
declare const GM_xmlhttpRequest: (options: any) => void;
declare const GM_addValueChangeListener: (
  name: string,
  callback: TValueChangeListener
) => number;
declare const GM_removeValueChangeListener: (id: number) => void;
declare const GM_info: any;
declare const unsafeWindow: any;

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.svg';
