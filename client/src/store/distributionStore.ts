import { create } from 'zustand';
import api from '../services/api';
import type { DistributionPlatform, ScheduledPost } from '../types';

interface DistributionState {
    platforms: DistributionPlatform[];
    scheduledPosts: ScheduledPost[];
    isLoading: boolean;
    history: any[];

    fetchPlatforms: () => Promise<void>;
    fetchScheduledPosts: () => Promise<void>;
    fetchHistory: (params?: any) => Promise<void>;
    connectPlatform: (platformId: string, username?: string) => Promise<void>;
    disconnectPlatform: (platformId: string) => Promise<void>;
    distributeContent: (data: { contentId?: string; articleId?: string; platform: string; scheduleTime?: string }) => Promise<void>;
    cancelScheduledPost: (id: string) => Promise<void>;
}

export const useDistributionStore = create<DistributionState>((set, get) => ({
    platforms: [],
    scheduledPosts: [],
    isLoading: false,
    history: [],

    fetchPlatforms: async () => {
        set({ isLoading: true });
        try {
            const response = await api.getDistributionPlatforms();
            if (response.success && response.data) {
                set({
                    platforms: response.data.platforms,
                    isLoading: false,
                });
            }
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchScheduledPosts: async () => {
        set({ isLoading: true });
        try {
            const response = await api.getScheduledPosts();
            if (response.success && response.data) {
                set({
                    scheduledPosts: response.data.scheduledPosts,
                    isLoading: false,
                });
            }
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchHistory: async (params) => {
        set({ isLoading: true });
        try {
            const response = await api.getDistributionHistory(params);
            if (response.success && response.data) {
                set({
                    history: response.data.history,
                    isLoading: false,
                });
            }
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    connectPlatform: async (platformId, username) => {
        set({ isLoading: true });
        try {
            const response = await api.connectPlatform(platformId, username);
            if (response.success) {
                await get().fetchPlatforms();
            }
            set({ isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    disconnectPlatform: async (platformId) => {
        set({ isLoading: true });
        try {
            const response = await api.disconnectPlatform(platformId);
            if (response.success) {
                await get().fetchPlatforms();
            }
            set({ isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    distributeContent: async (data: { contentId?: string; articleId?: string; platform: string; scheduleTime?: string }) => {
        set({ isLoading: true });
        try {
            await api.distributeContent(data);
            if (data.scheduleTime) {
                await get().fetchScheduledPosts();
            } else {
                await get().fetchHistory();
            }
            set({ isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    cancelScheduledPost: async (id) => {
        set({ isLoading: true });
        try {
            const response = await api.cancelScheduledPost(id);
            if (response.success) {
                await get().fetchScheduledPosts();
            }
            set({ isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },
}));
