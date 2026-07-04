import { useMemo } from 'react';

// The one intentional flourish on the auth screens: a field of dots that
// start scattered and settle into neat rows, one row at a time — a literal
// read of the product line "Every workday, perfectly aligned." Built with
// plain CSS transforms + staggered delays, no animation library.
const COLS = 7;
const ROWS = 5;
const SPACING = 34;

export function AlignmentGrid() {
  const dots = useMemo(() => {
    const items = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        // Deterministic-looking "scatter" derived from position, not Math.random,
        // so this renders the same way every time rather than jittering on re-render.
        const seed = row * COLS + col;
        const dx = (((seed * 37) % 60) - 30) * 1.4;
        const dy = (((seed * 53) % 60) - 30) * 1.4;
        const delay = row * 90 + ((seed * 17) % 40);
        items.push({ row, col, dx, dy, delay });
      }
    }
    return items;
  }, []);

  const width = (COLS - 1) * SPACING;
  const height = (ROWS - 1) * SPACING;

  return (
    <div
      className="alignment-grid"
      style={{ width, height }}
      role="img"
      aria-label="Rows of dots settling into alignment"
    >
      {dots.map(({ row, col, dx, dy, delay }) => (
        <span
          key={`${row}-${col}`}
          className="alignment-grid__dot"
          style={{
            left: col * SPACING,
            top: row * SPACING,
            '--dx': `${dx}px`,
            '--dy': `${dy}px`,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
