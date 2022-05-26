export function formatBytes(n) {
  if (n >= 1024 * 1024 * 1024)
    return `${(n / (1024 * 1024 * 1024)).toFixed(3)} GB`;
  if (n >= 1024 * 1024)
    return `${(n / (1024 * 1024)).toFixed(3)} MB`;
  if (n >= 1024)
    return `${(n / 1024).toFixed(3)} kB`;
  return `${n.toFixed()} bytes`;
}

export function formatBytesPerSecond(n) {
  return formatBytes(n) + "/s";
}

export function sortBy (array, field, desc=false) {
  const sorter = (array.length && typeof array[0][field] === "string") ?
    (a,b) => (desc ? -1 : 1) * (a[field].localeCompare(b[field]))
    :
    (a,b) => (desc ? -1 : 1) * (a[field] - b[field]);

  return array.sort(sorter);
}

export function formatDuration (seconds, fractionalSeconds = false) {
  const out = [];
  if (seconds > 24 * 60 * 60) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds -= days * 24 * 60 * 60;
    out.push(days + (days === 1 ? " day" : " days"));
  }
  if (seconds > 60 * 60) {
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * 60 * 60;
    out.push(hours + (hours === 1 ? " hour" : " hours"));
  }
  if (seconds > 60) {
    const minutes = Math.floor(seconds / (60));
    seconds -= minutes * 60;
    out.push(minutes + (minutes === 1 ? " minute" : " minutes"));
  }
  if (seconds > 0) {
    if (!fractionalSeconds) {
      seconds = Math.round(seconds);
    }
    out.push(seconds + (seconds === 1 ? " second" : " seconds"));
  }
  return out.join(" ");
}

export function countSeeds(torrent) {
  return Math.max(0, ...torrent.trackerStats.map(s => s.seederCount));
}