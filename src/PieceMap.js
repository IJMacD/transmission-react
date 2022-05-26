import React, { useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

export default React.memo(PieceMap);

function PieceMap ({ pieces, count }) {
  const [ previousPieces, setPreviousPieces ] = useState("");
  const debouncedPreviousPieces = useDebounce(previousPieces, 2000);

  useEffect(() => {
    setPreviousPieces(pieces);
  }, [pieces]);

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {[...Array(count)].map((_, i) => <div
        key={i}
        title={`Piece ${i}`}
        className={`PieceMap-Piece ${isPieceDone(pieces, i) ? `PieceMap-Piece--done` : ""} ${isPieceNew(pieces, debouncedPreviousPieces, i) ? `PieceMap-Piece--new` : ""}`} />
      )}
    </div>
  );
}

function isPieceDone(pieces, i) {
  const byteString = atob(pieces);
  const byteIndex = Math.floor(i / 8);
  const byteVal = byteString.charCodeAt(byteIndex);
  return (byteVal & (128 >> (i % 8))) > 0;
}

function isPieceNew(pieces, previousPieces, i) {
  return previousPieces !== "" && isPieceDone(pieces, i) && !isPieceDone(previousPieces, i);
}
