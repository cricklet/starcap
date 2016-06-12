export type Buffer = {
  el: HTMLCanvasElement,
  context: CanvasRenderingContext2D
};

function bufferWidth(buffer: Buffer) {
  return buffer.el.width
}

function bufferHeight(buffer: Buffer) {
  return buffer.el.height
}

export function setupBuffer(el: HTMLCanvasElement, width: number, height: number): Buffer {
  el.width = width
  el.height = height

  let context = el.getContext('2d')
  context.imageSmoothingEnabled = false

  return {
    el: el,
    context: context
  }
}

export function createBuffer(width: number, height: number): Buffer {
  let el = document.createElement('canvas');
  el.width  = width;
  el.height = height;

  let context = el.getContext('2d')
  context.imageSmoothingEnabled = false

  return {
    el: el,
    context: context
  }
}

export function drawBuffer(sourceBuffer: Buffer, destBuffer: Buffer) {
  sourceBuffer.context.drawImage(destBuffer.el, 0, 0);
}

export function drawBackground(buffer: Buffer, color: string) {
  buffer.context.fillStyle = color
  buffer.context.fillRect(0, 0, bufferWidth(buffer), bufferHeight(buffer))
}

export function drawRect(buffer: Buffer, color: string, x0, y0, x1, y1): Sprite {
  let w = x1 - x0
  let h = y1 - y0

  buffer.context.fillStyle = color
  buffer.context.fillRect(x0, bufferHeight(buffer) - y0 - h, w, h)
}
