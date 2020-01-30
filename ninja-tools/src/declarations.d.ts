declare const GM_notification: (options: any) => void;
declare const GM_setClipboard: (content: string) => void;
declare const GM_getValue: (key: string, defaultValue?: any) => any;
declare const GM_setValue: (key: string, value: string) => void;
declare const GM_openInTab: (url: string, background: boolean) => void;
declare const GM_getResourceURL: (name: string) => string;
declare const GM_info: any;
declare const unsafeWindow: any;

declare module '*.css' {
  const content: string;
  export default content;
}
