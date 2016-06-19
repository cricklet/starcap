/* @flow */

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
  if (!(context instanceof CanvasRenderingContext2D)) {
    throw "Unable to get canvas context."
  }
  context.imageSmoothingEnabled = false

  return {
    el: el,
    context: context
  }
}

export function createBuffer(width: number, height: number): Buffer {
  let el = document.createElement('canvas');
  if (!(el instanceof HTMLCanvasElement)) {
    throw "Unable to create buffer."
  }
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

export function drawRect(
  buffer: Buffer,
  color: string,
  rect: {x0:number, y0:number, x1:number, y1:number}
) {
  let w = rect.x1 - rect.x0
  let h = rect.y1 - rect.y0

  buffer.context.fillStyle = color
  buffer.context.fillRect(rect.x0, bufferHeight(buffer) - rect.y0 - h, w, h)
}

var _imageCache = {};
function loadImage(source: string) {
  if (source in _imageCache) {
    return _imageCache[source];
  } else {
    let drawing = new Image();
    drawing.src = source;
    _imageCache[source] = drawing;
    return drawing;
  }
}

function cacheAllImages(sources: Array<string>) {
  return sources.map(loadImage)
}

export function drawImage(
  buffer: Buffer,
  imageSource: string,
  rect: {x0:number, y0:number, x1:number, y1:number},
  opts: { flip?: boolean, opacity?: number }
) {
  let w = rect.x1 - rect.x0
  let h = rect.y1 - rect.y0
  let x = rect.x0 + w * 0.5
  let y = bufferHeight(buffer) - rect.y0 - h * 0.5

  buffer.context.save();
  buffer.context.translate(x, y)

  if (opts.flip) buffer.context.scale(-1, 1);
  if (opts.opacity) buffer.context.globalAlpha = opts.opacity

  buffer.context.drawImage(loadImage(imageSource), -w / 2, -h / 2, w, h);
  // buffer.context.drawImage(shadow, -w / 2, -h / 2, w, h);

  buffer.context.restore();
}
