import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Article, BrandVoice, ProcessingJob } from '../types';
import api from '../services/api';
import socketService from '../services/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; company?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.login(email, password);
          if (response.success && response.data?.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            // Connect socket with user ID
            socketService.connect(response.data.user.id);
          } else {
            throw new Error(response.error?.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.register(data);
          if (response.success && response.data?.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            socketService.connect(response.data.user.id);
          } else {
            throw new Error(response.error?.message || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        api.logout();
        socketService.disconnect();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface ArticleState {
  articles: Article[];
  currentArticle: Article | null;
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  fetchArticles: (params?: { page?: number; limit?: number; status?: string; search?: string }) => Promise<void>;
  fetchArticle: (id: string) => Promise<void>;
  createArticle: (data: { title: string; content?: string; file?: File }) => Promise<void>;
  updateArticle: (id: string, data: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  processArticle: (id: string, platforms?: string[]) => Promise<void>;
  generateArticle: (data: { title: string; info: string; brandVoiceId?: string }) => Promise<void>;
  clearCurrentArticle: () => void;
}

export const useArticleStore = create<ArticleState>((set, get) => ({
  articles: [],
  currentArticle: null,
  isLoading: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },

  fetchArticles: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.getArticles(params);
      if (response.success && response.data) {
        set({
          articles: response.data.articles,
          pagination: response.data.pagination,
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchArticle: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.getArticle(id);
      if (response.success && response.data) {
        set({
          currentArticle: response.data.article,
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createArticle: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.createArticle(data);
      if (response.success && response.data?.article) {
        const { articles, pagination } = get();
        set({
          articles: [response.data.article, ...articles],
          pagination: {
            ...pagination,
            total: pagination.total + 1,
          },
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateArticle: async (id, data) => {
    set({ isLoading: true });
    try {
      const response = await api.updateArticle(id, data);
      if (response.success && response.data?.article) {
        const articles = get().articles.map((a) =>
          a._id === id ? response.data!.article : a
        );
        set({
          articles,
          currentArticle: response.data.article,
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteArticle: async (id) => {
    try {
      const response = await api.deleteArticle(id);
      if (response.success) {
        const articles = get().articles.filter((a) => a._id !== id);
        set({
          articles,
          pagination: {
            ...get().pagination,
            total: get().pagination.total - 1,
          },
        });
      }
    } catch (error) {
      throw error;
    }
  },

  processArticle: async (id, platforms) => {
    try {
      const response = await api.processArticle(id, platforms);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  generateArticle: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.generateArticle(data);
      if (response.success && response.data?.article) {
        const { articles, pagination } = get();
        set({
          articles: [response.data.article, ...articles],
          pagination: {
            ...pagination,
            total: pagination.total + 1,
          },
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearCurrentArticle: () => {
    set({ currentArticle: null });
  },
}));

interface BrandVoiceState {
  brandVoices: BrandVoice[];
  currentBrandVoice: BrandVoice | null;
  isLoading: boolean;
  fetchBrandVoices: () => Promise<void>;
  fetchBrandVoice: (id: string) => Promise<void>;
  createBrandVoice: (data: Partial<BrandVoice>) => Promise<void>;
  updateBrandVoice: (id: string, data: Partial<BrandVoice>) => Promise<void>;
  deleteBrandVoice: (id: string) => Promise<void>;
}

export const useBrandVoiceStore = create<BrandVoiceState>((set) => ({
  brandVoices: [],
  currentBrandVoice: null,
  isLoading: false,

  fetchBrandVoices: async () => {
    set({ isLoading: true });
    try {
      const response = await api.getBrandVoices();
      if (response.success && response.data) {
        set({
          brandVoices: response.data.voices,
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchBrandVoice: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.getBrandVoice(id);
      if (response.success && response.data) {
        set({
          currentBrandVoice: response.data.voice,
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createBrandVoice: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.createBrandVoice(data);
      if (response.success && response.data?.voice) {
        set((state) => ({
          brandVoices: [...state.brandVoices, response.data!.voice],
          isLoading: false,
        }));
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateBrandVoice: async (id, data) => {
    set({ isLoading: true });
    try {
      const response = await api.updateBrandVoice(id, data);
      if (response.success && response.data?.voice) {
        set((state) => ({
          brandVoices: state.brandVoices.map((bv) =>
            bv._id === id ? response.data!.voice : bv
          ),
          currentBrandVoice: response.data.voice,
          isLoading: false,
        }));
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteBrandVoice: async (id) => {
    try {
      const response = await api.deleteBrandVoice(id);
      if (response.success) {
        set((state) => ({
          brandVoices: state.brandVoices.filter((bv) => bv._id !== id),
        }));
      }
    } catch (error) {
      throw error;
    }
  },
}));

interface ProcessingState {
  currentJob: ProcessingJob | null;
  agentStatuses: {
    researcher: string;
    reformatter: string;
    factChecker: string;
    seoOptimizer: string;
  };
  setCurrentJob: (job: ProcessingJob | null) => void;
  updateAgentStatus: (agent: string, status: string) => void;
  clearProcessing: () => void;
}

export const useProcessingStore = create<ProcessingState>((set) => ({
  currentJob: null,
  agentStatuses: {
    researcher: 'idle',
    reformatter: 'idle',
    factChecker: 'idle',
    seoOptimizer: 'idle',
  },

  setCurrentJob: (job) => {
    set({ currentJob: job });
  },

  updateAgentStatus: (agent, status) => {
    set((state) => ({
      agentStatuses: {
        ...state.agentStatuses,
        [agent]: status,
      },
    }));
  },

  clearProcessing: () => {
    set({
      currentJob: null,
      agentStatuses: {
        researcher: 'idle',
        reformatter: 'idle',
        factChecker: 'idle',
        seoOptimizer: 'idle',
      },
    });
  },
}));

