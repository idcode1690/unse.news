// src/setupTests.jsx
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Jest 호환을 위한 전역 매핑 (jest.fn(), jest.spyOn 등)
if (!globalThis.jest) {
	// vitest의 vi 유틸을 jest 네임스페이스로 노출
	globalThis.jest = vi;
}

// jsdom 환경 보강: 존재하지 않는 API를 안전하게 더미로 정의
if (typeof window !== 'undefined') {
	if (!window.matchMedia) {
		window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
	}
}
