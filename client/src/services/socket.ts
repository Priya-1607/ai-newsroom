import { io, Socket } from 'socket.io-client';
import type { ProcessingJob, ScheduledPost } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) {
      return;
    }

    this.userId = userId;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
      query: {
        userId,
      },
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  // Process events
  onProcessStarted(callback: (data: { jobId: string; articleId: string; title: string }) => void) {
    this.socket?.on('process:started', callback);
  }

  onProcessUpdate(callback: (data: ProcessingJob) => void) {
    this.socket?.on('process:update', callback);
  }

  onProcessCompleted(callback: (data: { jobId: string; articleId: string; results: any }) => void) {
    this.socket?.on('process:completed', callback);
  }

  onProcessFailed(callback: (data: { jobId: string; error: string }) => void) {
    this.socket?.on('process:failed', callback);
  }

  onAgentStatus(callback: (data: { agent: string; status: string }) => void) {
    this.socket?.on('agent:status', callback);
  }

  // Distribution events
  onDistributionStarted(callback: (data: { platform: string; contentId: string }) => void) {
    this.socket?.on('distribution:started', callback);
  }

  onDistributionCompleted(callback: (data: { platform: string; contentId: string; result: any }) => void) {
    this.socket?.on('distribution:completed', callback);
  }

  onDistributionFailed(callback: (data: { platform: string; contentId: string; error: string }) => void) {
    this.socket?.on('distribution:failed', callback);
  }

  onDistributionScheduled(callback: (data: { scheduledPost: ScheduledPost }) => void) {
    this.socket?.on('distribution:scheduled', callback);
  }

  // Off methods to remove event listeners
  offProcessStarted(callback?: (...args: any[]) => void) {
    this.socket?.off('process:started', callback);
  }

  offProcessUpdate(callback?: (...args: any[]) => void) {
    this.socket?.off('process:update', callback);
  }

  offProcessCompleted(callback?: (...args: any[]) => void) {
    this.socket?.off('process:completed', callback);
  }

  offProcessFailed(callback?: (...args: any[]) => void) {
    this.socket?.off('process:failed', callback);
  }

  offAgentStatus(callback?: (...args: any[]) => void) {
    this.socket?.off('agent:status', callback);
  }

  offDistributionStarted(callback?: (...args: any[]) => void) {
    this.socket?.off('distribution:started', callback);
  }

  offDistributionCompleted(callback?: (...args: any[]) => void) {
    this.socket?.off('distribution:completed', callback);
  }

  offDistributionFailed(callback?: (...args: any[]) => void) {
    this.socket?.off('distribution:failed', callback);
  }

  offDistributionScheduled(callback?: (...args: any[]) => void) {
    this.socket?.off('distribution:scheduled', callback);
  }

  // Request status for a job
  requestProcessStatus(jobId: string) {
    this.socket?.emit('process:status', jobId);
  }

  // Cancel a process
  cancelProcess(jobId: string) {
    this.socket?.emit('process:cancel', jobId);
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
export default socketService;

