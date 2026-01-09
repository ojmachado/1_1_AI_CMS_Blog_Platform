
import { BlogPost, PostStatus, IntegrationSettings, ThemeSettings } from '../types';

const STORAGE_KEYS = {
    POSTS: 'cms_posts',
    CONFIG: 'cms_config',
    THEME: 'cms_theme'
};

const getStorageData = <T>(key: string, fallback: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
};

const setStorageData = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const dbService = {
  getAllPosts: async (): Promise<BlogPost[]> => {
    return getStorageData<BlogPost[]>(STORAGE_KEYS.POSTS, []);
  },

  getPublishedPosts: async (): Promise<BlogPost[]> => {
    const posts = await dbService.getAllPosts();
    return posts.filter(p => p.status === PostStatus.PUBLISHED);
  },

  getPostBySlug: async (slug: string): Promise<BlogPost | undefined> => {
    const posts = await dbService.getAllPosts();
    return posts.find(p => p.slug === slug);
  },

  getPostById: async (id: string): Promise<BlogPost | undefined> => {
    const posts = await dbService.getAllPosts();
    return posts.find(p => p.id === id);
  },

  createPost: async (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> => {
    const now = new Date().toISOString();
    const posts = await dbService.getAllPosts();
    const newPost = { 
      ...post, 
      id: Math.random().toString(36).substring(7), 
      createdAt: now, 
      updatedAt: now 
    } as BlogPost;
    setStorageData(STORAGE_KEYS.POSTS, [newPost, ...posts]);
    return newPost;
  },

  updatePost: async (id: string, updates: Partial<BlogPost>): Promise<void> => {
    const posts = await dbService.getAllPosts();
    const updated = posts.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    setStorageData(STORAGE_KEYS.POSTS, updated);
  },

  deletePost: async (id: string): Promise<void> => {
    const posts = await dbService.getAllPosts();
    setStorageData(STORAGE_KEYS.POSTS, posts.filter(p => p.id !== id));
  },

  getSettings: async (): Promise<IntegrationSettings> => {
    return getStorageData<IntegrationSettings>(STORAGE_KEYS.CONFIG, {
      googleAnalyticsId: '', googleAdSenseId: '', facebookPixelId: '', metaAccessToken: '',
      siteUrl: '', googleSearchConsoleCode: '', metaWhatsappToken: '', metaPhoneId: '',
      metaBusinessId: '', evolutionApiUrl: '', evolutionApiKey: '', evolutionInstanceName: '',
      whatsappAdminNumber: '', resendApiKey: '', resendFromEmail: ''
    });
  },

  updateSettings: async (settings: IntegrationSettings): Promise<void> => {
    setStorageData(STORAGE_KEYS.CONFIG, settings);
  },

  getTheme: async (): Promise<ThemeSettings> => {
    return getStorageData<ThemeSettings>(STORAGE_KEYS.THEME, {
      primaryColor: '#6366f1',
      secondaryColor: '#1e3a8a',
      logoUrl: '',
      siteName: 'AI CMS Local'
    });
  },

  updateTheme: async (settings: ThemeSettings): Promise<void> => {
    setStorageData(STORAGE_KEYS.THEME, settings);
  }
};
