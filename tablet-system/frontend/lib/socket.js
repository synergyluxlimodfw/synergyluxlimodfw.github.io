import { io } from 'socket.io-client';

let socket;

/**
 * Returns a singleton socket instance.
 * Safe to call multiple times — always returns the same socket.
 */
export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

/**
 * Connect to socket and join the ride room.
 */
export function connectToRide(rideId) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('join:ride', rideId);
  return s;
}
