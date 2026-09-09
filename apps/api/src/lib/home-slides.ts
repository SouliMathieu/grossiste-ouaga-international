export const MAX_ACTIVE_HOME_SLIDES = 4;

export function wouldExceedActiveHomeSlideLimit(
  activeCount: number,
  requestedActive: boolean,
  currentlyActive = false,
) {
  const projectedActiveCount =
    activeCount -
    (currentlyActive ? 1 : 0) +
    (requestedActive ? 1 : 0);

  return (
    projectedActiveCount >
    MAX_ACTIVE_HOME_SLIDES
  );
}
