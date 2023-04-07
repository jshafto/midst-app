export interface ChangeObj {
  front: number;
  inserted: string;
  end: number;
  t: Date;
}

export const step = (initial: string, change: ChangeObj) => {
  const endingIndex = initial.length - change.end;
  return (
    initial.slice(0, change.front) +
    change.inserted +
    initial.slice(endingIndex)
  );
};

export const compareStrings = (str: string, next: string): ChangeObj => {
  let inserted = '';
  let front = 0;
  let end = 0;
  const t = new Date();
  if (str === next) return { inserted, front, end: 0, t };
  while (str[front] === next[front] && front < str.length) {
    front += 1;
  }

  // you could definitely do this just by shortening the while loop but okay
  const choppedStr = str.slice(front);
  const choppedNext = next.slice(front);
  while (
    choppedStr[choppedStr.length - end - 1] ===
      choppedNext[choppedNext.length - end - 1] &&
    end < choppedStr.length
  ) {
    end += 1;
  }

  inserted = next.slice(front, next.length - end);
  return { inserted, front, end, t };
};

export const reconstruct = (
  initial: string,
  changes: ChangeObj[],
  index: number
) => {
  if (changes) {
    return changes
      .slice(0, index + 1)
      .reduce((acc, val) => step(acc, val), initial);
  }
  return '';
};
