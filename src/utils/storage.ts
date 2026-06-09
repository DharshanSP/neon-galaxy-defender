const HIGH_SCORE_KEY = 'neon-defender-high-score';
const SOUND_KEY = 'neon-defender-sound';

export const loadHighScore = (): number => {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
  } catch {
    return 0;
  }
};

export const saveHighScore = (score: number): void => {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch {}
};

export const loadSoundSetting = (): boolean => {
  try {
    const val = localStorage.getItem(SOUND_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

export const saveSoundSetting = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_KEY, enabled.toString());
  } catch {}
};
