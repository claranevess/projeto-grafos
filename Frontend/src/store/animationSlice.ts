export interface AnimationState {
  playing: boolean
  speed:   number
  step:    number
  t:       number
  play:    () => void
  pause:   () => void
  reset:   () => void
  setSpeed:(v: number) => void
  tick:    (dt: number) => void
}

export const createAnimationSlice = (set: (fn: (s: AnimationState) => Partial<AnimationState>) => void): AnimationState => ({
  playing: false,
  speed:   1,
  step:    0,
  t:       0,
  play:    () => set(() => ({ playing: true })),
  pause:   () => set(() => ({ playing: false })),
  reset:   () => set(() => ({ playing: false, step: 0, t: 0 })),
  setSpeed: v => set(() => ({ speed: v })),
  tick: dt => set(s => {
    if (!s.playing) return {}
    const next = s.t + dt * s.speed * 0.0002
    return next >= 1 ? { t: 1, playing: false } : { t: next }
  }),
})
