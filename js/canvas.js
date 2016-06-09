
export type Buffer = {buffer: string; context: boolean};

export function createBuffer(width: number, height: number) {
  let buffer = document.createElement('canvas');
  buffer.width  = width;
  buffer.height = height;
  return buffer;
}

export function drawBuffer(context, buffer) {
  context.drawImage(buffer, 0, 0);
}
