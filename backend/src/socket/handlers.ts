import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface AuthPayload {
  userId: string;
  email: string;
}

export function initSocketHandlers(io: Server): void {
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error('Server misconfiguration'));
    }

    try {
      const payload = jwt.verify(token, secret) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    console.log(`Socket connected: user=${user.userId} socketId=${socket.id}`);

    // Client sends "join-room" with roomId
    socket.on('join-room', async (roomId: string) => {
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('error', { message: 'Invalid roomId' });
        return;
      }

      // Verify membership
      const membership = await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId: user.userId } },
      });

      if (!membership) {
        socket.emit('error', { message: 'You are not a member of this room' });
        return;
      }

      socket.join(roomId);
      console.log(`User ${user.userId} joined room ${roomId}`);

      // Notify others in room that a partner has connected
      socket.to(roomId).emit('partner-connected', { userId: user.userId });
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      socket.to(roomId).emit('partner-disconnected', { userId: user.userId });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user=${user.userId} socketId=${socket.id}`);
    });
  });
}
