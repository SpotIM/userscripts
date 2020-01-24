import { padTime } from './utils';

export default (() => {
  const now = new Date();
  return now.getHours() + ':' + padTime(now.getMinutes().toString());
})();
