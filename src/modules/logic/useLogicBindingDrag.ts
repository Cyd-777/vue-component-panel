import { onUnmounted, ref } from 'vue'

export interface BindingDragStartPayload {
  blockId: string
  anchorX: number
  anchorY: number
}

interface CanvasRect {
  x: number
  y: number
  width: number
  height: number
}

export function useLogicBindingDrag(options: {
  hitElement: (target: EventTarget | null) => HTMLElement | null
  getElementRect: (el: HTMLElement) => CanvasRect | null
  onComplete: (blockId: string, elIndex: number) => void
}) {
  const dragActive = ref(false)
  const dragBlockId = ref<string | null>(null)
  const dragAnchor = ref<{ x: number; y: number } | null>(null)
  const dragPointer = ref<{ x: number; y: number } | null>(null)
  const hoverElIndex = ref<number | null>(null)
  const hoverRect = ref<CanvasRect | null>(null)

  let moveHandler: ((e: PointerEvent) => void) | null = null
  let upHandler: ((e: PointerEvent) => void) | null = null
  let keyHandler: ((e: KeyboardEvent) => void) | null = null

  function updateHover(clientX: number, clientY: number) {
    dragPointer.value = { x: clientX, y: clientY }
    const el = document.elementFromPoint(clientX, clientY)
    const hit = options.hitElement(el)
    const idxStr = hit?.getAttribute('data-el-i')
    if (!idxStr) {
      hoverElIndex.value = null
      hoverRect.value = null
      return
    }
    hoverElIndex.value = parseInt(idxStr, 10)
    hoverRect.value = hit ? options.getElementRect(hit) : null
  }

  function stopDrag(complete: boolean) {
    if (moveHandler) {
      document.removeEventListener('pointermove', moveHandler)
      moveHandler = null
    }
    if (upHandler) {
      document.removeEventListener('pointerup', upHandler)
      upHandler = null
    }
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler)
      keyHandler = null
    }

    const blockId = dragBlockId.value
    const elIndex = hoverElIndex.value

    dragActive.value = false
    dragBlockId.value = null
    dragAnchor.value = null
    dragPointer.value = null
    hoverElIndex.value = null
    hoverRect.value = null

    if (complete && blockId != null && elIndex != null) {
      options.onComplete(blockId, elIndex)
    }
  }

  function startDrag(payload: BindingDragStartPayload) {
    stopDrag(false)
    dragActive.value = true
    dragBlockId.value = payload.blockId
    dragAnchor.value = { x: payload.anchorX, y: payload.anchorY }
    dragPointer.value = { x: payload.anchorX, y: payload.anchorY }

    moveHandler = (e: PointerEvent) => updateHover(e.clientX, e.clientY)
    upHandler = () => stopDrag(true)
    keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopDrag(false)
    }

    document.addEventListener('pointermove', moveHandler)
    document.addEventListener('pointerup', upHandler)
    document.addEventListener('keydown', keyHandler)
  }

  onUnmounted(() => stopDrag(false))

  return {
    dragActive,
    dragBlockId,
    dragAnchor,
    dragPointer,
    hoverElIndex,
    hoverRect,
    startDrag,
    cancelDrag: () => stopDrag(false),
  }
}
