import { countText, plural } from './plural';
import { TASKS } from './common';

describe('counting words', () => {
  it('uses the one form for exactly 1 and the other form for anything else', () => {
    expect(countText(1, TASKS)).toBe('1 task');
    expect(countText(3, TASKS)).toBe('3 tasks');
    expect(countText(0, TASKS)).toBe('0 tasks');
    expect(plural(1, { one: 'box', other: 'boxes' })).toBe('box');
    expect(plural(2, { one: 'box', other: 'boxes' })).toBe('boxes');
  });
});
