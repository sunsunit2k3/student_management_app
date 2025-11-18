import 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    skipLoading?: boolean;
  }
}
