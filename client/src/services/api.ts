import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse<any>>) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request
            return this.client.request(error.config!);
          }
          // Redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  setRefreshToken(token: string) {
    localStorage.setItem('refreshToken', token);
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await this.client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
        refreshToken,
      });

      if (response.data.success && response.data.data?.accessToken) {
        this.setAccessToken(response.data.data.accessToken);
        return true;
      }
      return false;
    } catch {
      this.logout();
      return false;
    }
  }

  async login(email: string, password: string) {
    const response = await this.client.post<ApiResponse<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>>('/auth/login', { email, password });

    if (response.data.success && response.data.data) {
      this.setAccessToken(response.data.data.accessToken);
      this.setRefreshToken(response.data.data.refreshToken);
    }

    return response.data;
  }

  async register(data: { email: string; password: string; name: string; company?: string }) {
    const response = await this.client.post<ApiResponse<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>>('/auth/register', data);

    if (response.data.success && response.data.data) {
      this.setAccessToken(response.data.data.accessToken);
      this.setRefreshToken(response.data.data.refreshToken);
    }

    return response.data;
  }

  logout() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Articles API
  async getArticles(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const response = await this.client.get<ApiResponse<{
      articles: any[];
      pagination: any;
    }>>('/articles', { params });
    return response.data;
  }

  async getArticle(id: string) {
    const response = await this.client.get<ApiResponse<{
      article: any;
      reformattedContent: any[];
    }>>(`/articles/${id}`);
    return response.data;
  }

  async createArticle(data: { title: string; content?: string; file?: File }) {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.file) formData.append('file', data.file);

    const response = await this.client.post<ApiResponse<{ article: any }>>('/articles', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async updateArticle(id: string, data: Partial<{ title: string; content: string; brandVoice: string }>) {
    const response = await this.client.put<ApiResponse<{ article: any }>>(`/articles/${id}`, data);
    return response.data;
  }

  async deleteArticle(id: string) {
    const response = await this.client.delete<ApiResponse<null>>(`/articles/${id}`);
    return response.data;
  }

  async processArticle(id: string, platforms?: string[]) {
    const response = await this.client.post<ApiResponse<{ jobId: string }>>(`/articles/${id}/process`, {
      platforms,
    });
    return response.data;
  }

  async generateArticle(data: { title: string; info: string; brandVoiceId?: string }) {
    const response = await this.client.post<ApiResponse<{ article: any }>>('/articles/generate', data);
    return response.data;
  }

  // Brand Voices API
  async getBrandVoices() {
    const response = await this.client.get<ApiResponse<{ voices: any[] }>>('/brand-voices');
    return response.data;
  }

  async getBrandVoice(id: string) {
    const response = await this.client.get<ApiResponse<{ voice: any }>>(`/brand-voices/${id}`);
    return response.data;
  }

  async createBrandVoice(data: any) {
    const response = await this.client.post<ApiResponse<{ voice: any }>>('/brand-voices', data);
    return response.data;
  }

  async updateBrandVoice(id: string, data: any) {
    const response = await this.client.put<ApiResponse<{ voice: any }>>(`/brand-voices/${id}`, data);
    return response.data;
  }

  async deleteBrandVoice(id: string) {
    const response = await this.client.delete<ApiResponse<null>>(`/brand-voices/${id}`);
    return response.data;
  }

  // Process API
  async startProcessing(data: { articleId: string; platforms?: string[]; brandVoiceId?: string }) {
    const response = await this.client.post<ApiResponse<{ jobId: string }>>('/process/start', data);
    return response.data;
  }

  async getProcessStatus(jobId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/process/status/${jobId}`);
    return response.data;
  }

  async getProcessResults(articleId: string, platform?: string) {
    const response = await this.client.get<ApiResponse<any>>(`/process/results/${articleId}`, {
      params: { platform },
    });
    return response.data;
  }

  async reformatContent(data: { content: string; platform: string; brandVoiceId?: string }) {
    const response = await this.client.post<ApiResponse<any>>('/process/reformat', data);
    return response.data;
  }

  // Distribution API
  async distributeContent(data: { contentId?: string; articleId?: string; platform: string; scheduleTime?: string }) {
    const response = await this.client.post<ApiResponse<any>>('/distribute', data);
    return response.data;
  }

  async getDistributionHistory(params?: { page?: number; limit?: number; platform?: string }) {
    const response = await this.client.get<ApiResponse<any>>('/distribute/history', { params });
    return response.data;
  }

  async getScheduledPosts() {
    const response = await this.client.get<ApiResponse<{ scheduledPosts: any[] }>>('/distribute/scheduled');
    return response.data;
  }

  async cancelScheduledPost(id: string) {
    const response = await this.client.delete<ApiResponse<null>>(`/distribute/scheduled/${id}`);
    return response.data;
  }

  async getDistributionPlatforms() {
    const response = await this.client.get<ApiResponse<{ platforms: any[] }>>('/distribute/platforms');
    return response.data;
  }

  async connectPlatform(platform: string, username?: string) {
    const response = await this.client.post<ApiResponse<any>>(`/distribute/connect/${platform}`, { username });
    return response.data;
  }

  async disconnectPlatform(platform: string) {
    const response = await this.client.delete<ApiResponse<any>>(`/distribute/disconnect/${platform}`);
    return response.data;
  }
}

export const api = new ApiService();
export default api;

