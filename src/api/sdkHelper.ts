// SDK 辅助函数 - 只负责获取认证头
declare global {
  interface Window {
    ApiCodeAuth: any;
  }
}

let authInstance: any = null;

// 初始化 SDK（在 App.tsx 中调用）
export const initAuthSDK = (config: {
  account: string;
  totpSecret: string;
  accessToken: string;
  baseURL?: string;
}) => {
  if (typeof window !== 'undefined' && window.ApiCodeAuth && !authInstance) {
    authInstance = new window.ApiCodeAuth({
      baseURL: config.baseURL || 'https://api.apiscode.org',
      account: config.account,
      totpSecret: config.totpSecret,
      accessToken: config.accessToken
    });
    console.log('Auth SDK 初始化成功');
  }
};

// 获取动态请求头（保持原有 getAuthHeaders 的调用方式）
export const getDynamicHeaders = async () => {
  if (!authInstance) {
    // 如果 SDK 未初始化，返回普通头
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }
  
  try {
    // 使用 SDK 生成动态头
    const dynamicHeaders = await authInstance.getHeaders();
    return {
      ...dynamicHeaders,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('获取动态头失败:', error);
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }
};