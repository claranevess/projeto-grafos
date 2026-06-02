import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useStore } from '@/store'
import { useAnimationLoop } from '@/hooks/useAnimation'

export function AnimationControls() {
  useAnimationLoop()

  const { playing, speed, play, pause, reset, setSpeed } = useStore(s => ({
    playing:  s.playing,
    speed:    s.speed,
    play:     s.play,
    pause:    s.pause,
    reset:    s.reset,
    setSpeed: s.setSpeed,
  }))

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => playing ? pause() : play()}
        className="w-7 h-7 border border-[var(--border)] text-[var(--foreground)]"
      >
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={reset}
        className="w-7 h-7 border border-[var(--border)] text-[var(--foreground)]"
      >
        <RotateCcw size={12} />
      </Button>

      <Slider
        min={0.5}
        max={3}
        step={0.25}
        value={[speed]}
        onValueChange={([v]) => setSpeed(v)}
        className="flex-1 h-1.5"
      />
    </div>
  )
}
