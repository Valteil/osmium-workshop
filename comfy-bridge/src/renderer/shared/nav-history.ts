// Back/forward history for in-window navigation (the Wiki window, the
// Upscale tab's gallery picker), driven by the mouse's side buttons.
export class NavHistory<T> {
  private back: T[] = [];
  private fwd: T[] = [];
  current: T | null = null;
  constructor(private same: (a: T, b: T) => boolean) {}
  // A normal navigation: the old page goes on the back stack, forward clears.
  visit(entry: T): void {
    if (this.current !== null && !this.same(this.current, entry)) {
      this.back.push(this.current);
      this.fwd = [];
    }
    this.current = entry;
  }
  goBack(): T | null {
    const e = this.back.pop();
    if (e === undefined) return null;
    if (this.current !== null) this.fwd.push(this.current);
    this.current = e;
    return e;
  }
  goForward(): T | null {
    const e = this.fwd.pop();
    if (e === undefined) return null;
    if (this.current !== null) this.back.push(this.current);
    this.current = e;
    return e;
  }
}

// Mouse side buttons over `target`: 3 = Back, 4 = Forward. They never reach
// listeners behind it (the gallery sidebar's own Back), handled or not.
export function onSideButtons(target: EventTarget, back: () => void, forward: () => void): void {
  target.addEventListener('mouseup', (ev) => {
    const b = (ev as MouseEvent).button;
    if (b !== 3 && b !== 4) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (b === 3) back(); else forward();
  });
}
