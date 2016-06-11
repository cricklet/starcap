export type Buffer = {el: HTMLCanvasElement; context: CanvasRenderingContext2D};

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

export function drawBufferOn(sourceBuffer: Buffer, destBuffer: Buffer) {
  sourceBuffer.context.drawImage(destBuffer.el, 0, 0);
}
