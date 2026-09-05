// Helper to emit events to global Socket.IO instance
export function emitSocketEvent(eventName: string, payload: any, room?: string) {
  if (typeof global !== 'undefined' && global.io) {
    try {
      if (room) {
        global.io.to(room).emit(eventName, payload);
      } else {
        global.io.emit(eventName, payload);
      }
    } catch (err) {
      console.warn('Socket emit error:', err);
    }
  }
}
