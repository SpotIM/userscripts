let _shadowDOM;

export function get() {
  return _shadowDOM as HTMLElement;
}

export function set(shadowDOM) {
  _shadowDOM = shadowDOM;
}
