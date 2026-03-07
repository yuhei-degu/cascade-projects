// __mocks__/next-headers.ts — Next.js headers mock for tests
export const cookies = () => ({
  get: jest.fn(() => null),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
});
export const headers = () => new Headers();
