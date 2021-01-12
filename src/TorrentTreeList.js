import { TorrentEntry } from './TorrentList';

export function TorrentTreeList({ torrents, onTorrentClick, onStartClick }) {
  const map = new Map();

  for (const t of torrents) {
    const { name, downloadDir } = t;

    let lastMap = map;
    for (const seg of downloadDir.replace(/\/$/, "").split("/")) {
      let m
      if (lastMap.has(seg)) {
        m = lastMap.get(seg);
      } else {
        m = new Map();
        lastMap.set(seg, m);
      }

      lastMap = m;
    }

    lastMap.set(name, t);
  }

  return (
    <TreeItem item={map} onTorrentClick={onTorrentClick} onStartClick={onStartClick} />
  );
}

function TreeItem ({ item, onTorrentClick, onStartClick }) {
  return (
    <ul>
      {[...item.entries()].map(([key, value]) => {
        if (value instanceof Map) {
          return (
            <li key={key}>
              /{key}
              <TreeItem item={value} onTorrentClick={onTorrentClick} onStartClick={onStartClick} />
            </li>
          );
        }

        return (
          <li key={key} onClick={() => onTorrentClick(value.id)}>
            <TorrentEntry torrent={value} onStartClick={onStartClick} />
          </li>
        );
      })}
    </ul>
  )
}
