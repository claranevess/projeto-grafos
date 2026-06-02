import { create } from 'zustand'
import { createGraphSlice,     type GraphState     } from './graphSlice'
import { createAlgorithmSlice, type AlgorithmState } from './algorithmSlice'
import { createUISlice,        type UIState        } from './uiSlice'
import { createAnimationSlice, type AnimationState } from './animationSlice'
import { createMarvelSlice,    type MarvelState    } from './marvelSlice'

type StoreState = GraphState & AlgorithmState & UIState & AnimationState & MarvelState

export const useStore = create<StoreState>((set) => ({
  ...createGraphSlice(set as Parameters<typeof createGraphSlice>[0]),
  ...createAlgorithmSlice(set as Parameters<typeof createAlgorithmSlice>[0]),
  ...createUISlice(set as Parameters<typeof createUISlice>[0]),
  ...createAnimationSlice(set as Parameters<typeof createAnimationSlice>[0]),
  ...createMarvelSlice(set as Parameters<typeof createMarvelSlice>[0]),
}))
