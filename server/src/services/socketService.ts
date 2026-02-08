import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Types for socket events
interface ProcessEvent {
  jobId: string;
  articleId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  agentStatus?: {
    researcher: string;
    reformatter: string;
    factChecker: string;
    seoOptimizer: string;
  };
  error?: string;
}

interface UserSocket extends Socket {
  userId?: string;
}

export const initializeSocketHandlers = (io: SocketIOServer) => {
  // Authentication middleware for sockets
  io.use((socket: UserSocket, next) => {
    const token = socket.handshake.auth.token;
    // In production, verify JWT token here
    // For now, we'll accept any connection
    socket.userId = socket.handshake.query.userId as string || 'anonymous';
    next();
  });

  io.on('connection', (socket: UserSocket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user's room for private notifications
    if (socket.userId) {
      socket.join(socket.userId);
    }

    // Handle process status requests
    socket.on('process:status', (jobId: string) => {
      // Emit current status for the job
      socket.emit('process:update', {
        jobId,
        status: 'processing',
        progress: 50,
        currentStep: 'Processing content...',
      });
    });

    // Handle process cancellation
    socket.on('process:cancel', (jobId: string) => {
      console.log(`Process ${jobId} cancellation requested`);
      socket.emit('process:cancelled', { jobId });
    });

    // Handle real-time collaboration
    socket.on('content:edit', (data: { articleId: string; changes: any }) => {
      // Broadcast changes to other editors
      socket.to(data.articleId).emit('content:updated', data.changes);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Helper functions to emit events
  (io as any).emitProcessStarted = (userId: string, data: { jobId: string; articleId: string; title: string }) => {
    io.to(userId).emit('process:started', data);
  };

  (io as any).emitProcessProgress = (userId: string, progress: ProcessEvent) => {
    io.to(userId).emit('process:update', progress);
  };

  (io as any).emitProcessCompleted = (userId: string, data: { jobId: string; articleId: string; results: any }) => {
    io.to(userId).emit('process:completed', data);
  };

  (io as any).emitProcessFailed = (userId: string, data: { jobId: string; error: string }) => {
    io.to(userId).emit('process:failed', data);
  };

  (io as any).emitAgentStatus = (userId: string, data: { agent: string; status: string }) => {
    io.to(userId).emit('agent:status', data);
  };

  console.log('✅ Socket handlers initialized');
};

export { ProcessEvent };

