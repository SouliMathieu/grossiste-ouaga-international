import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  MAX_ACTIVE_HOME_SLIDES,
  wouldExceedActiveHomeSlideLimit,
} from './home-slides.js';

describe('home slides limit', () => {
  it('allows up to four active slides', () => {
    expect(
      wouldExceedActiveHomeSlideLimit(
        3,
        true,
      ),
    ).toBe(false);

    expect(
      MAX_ACTIVE_HOME_SLIDES,
    ).toBe(4);
  });

  it('rejects a fifth active slide', () => {
    expect(
      wouldExceedActiveHomeSlideLimit(
        4,
        true,
      ),
    ).toBe(true);
  });

  it('allows editing an already active slide', () => {
    expect(
      wouldExceedActiveHomeSlideLimit(
        4,
        true,
        true,
      ),
    ).toBe(false);
  });

  it('allows disabling an active slide', () => {
    expect(
      wouldExceedActiveHomeSlideLimit(
        4,
        false,
        true,
      ),
    ).toBe(false);
  });
});
