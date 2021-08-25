
export function FileTreeList({ files, onRenameClick }) {
  const map = new Map();

  for (const t of files) {
    const { name } = t;

    let prevMap = map;
    const segs = name.replace(/\/$/, "").split("/");
    const segsCount = segs.length;
    for (let i = 0; i < segsCount; i++) {
      const seg = segs[i];

      if (i === segsCount - 1) {
        prevMap.set(seg, t);
        break;
      }

      let m
      if (prevMap.has(seg)) {
        m = prevMap.get(seg);
      } else {
        m = new Map();
        prevMap.set(seg, m);
      }

      prevMap = m;
    }
  }

  return (
    <TreeItem item={map} onRenameClick={onRenameClick} />
  );
}

function TreeItem ({ item, onRenameClick }) {
  return (
    <ul className="TreeItem">
      {[...item.entries()].map(([key, value]) => {
        if (value instanceof Map) {
          return (
            <li key={key}>
              /{key} <button onClick={() => onRenameClick(key)}>Rename</button>
              <TreeItem item={value} onRenameClick={onRenameClick} />
            </li>
          );
        }

        return (
          <li key={key} className="file-item">
            {key} {((value.bytesCompleted/value.length)*100).toFixed()}% <button onClick={() => onRenameClick(value.name)}>Rename</button>
          </li>
        );
      })}
    </ul>
  )
}
