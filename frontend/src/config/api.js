/**
 * API 관련 설정을 관리하는 파일입니다.
 * 환경 변수(VITE_API_URL)가 설정되어 있으면 해당 값을 사용하고,
 * 설정되어 있지 않으면 로컬 개발 서버 주소(http://localhost:3000)를 기본값으로 사용합니다.
 */

export const API_ENDPOINTS = {
  EXTRACT_PROFILE: '/api/extract/profile',
  EXTRACT_BANK: '/api/extract/bank',
  HEALTH_CHECK: '/api/health',
};
