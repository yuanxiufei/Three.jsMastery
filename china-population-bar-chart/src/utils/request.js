import axios from 'axios'
import { getToken, removeToken } from './utils'

// 创建 axios 实例（统一超时、跨域携带凭据）
const instance = axios.create({
  timeout: 60000,
  timeoutErrorMessage: '请求超时，请稍后再试',
  withCredentials: true,
});

// 请求拦截器：
// - 自动附加 Authorization
// - 根据环境变量切换 baseURL（mock 与真实接口）
// - 文件上传统一附加业务参数 bizCode
instance.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = token
    }
    if (import.meta.env.VITE_MOCK == 'true') {
      config.baseURL = import.meta.env.VITE_MOCK_API_URL;
    } else {
      config.baseURL = import.meta.env.VITE_BASE_API;
    }

    // 文件上传附加参数（示例：bizCode）
    if(config.url && config.url.startsWith('/base/file/upload')){
      if(config.url.includes('?')){
        config.url += '&bizCode=' + import.meta.env.VITE_BIZ_CODE;
      }else{
        config.url += '?bizCode=' + import.meta.env.VITE_BIZ_CODE;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)

// 响应拦截器：
// - 401：清理本地凭据
// - 403/500：直接返回响应供调用方自行处理
instance.interceptors.response.use(
  response => {
    const data = response.data
    if (response.status == 401 || data.code == 401) {
      removeToken();
      return Promise.reject(response);
    }
    return response;
  },
  error => {
    if (error.status == 401) {
      removeToken();
    }
    if (error.status == 403 || error.status == 500) {
      //403和500正常处理
      return error.response;
    }
    return Promise.reject(error);
  }
)

// 导出轻量封装：统一 GET/POST 与下载文件
export default {
  /** 直接执行任意 axios 配置 */
  execute(config){
    return instance.request(config);
  },
  /** GET 请求：params 作为查询参数 */
  get(url, params, options) {
    return instance.get(url, { params, ...options });
  },
  /** POST 请求：params 作为请求体 */
  post(url, params, options) {
    return instance.post(url, params, options);
  },
  /** 下载文件：后端返回 blob（支持自定义文件名） */
  downloadFile(url, data, fileName = 'fileName.xlsx') {
    instance({
      url,
      data,
      method: 'post',
      responseType: 'blob'
    }).then(response => {
      const blob = new Blob([response.data], {
        type: response.data.type
      })
      const name = (response.headers['file-name']) || fileName
      const link = document.createElement('a')
      link.download = decodeURIComponent(name)
      link.href = URL.createObjectURL(blob)
      document.body.append(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)
    })
  }
}
