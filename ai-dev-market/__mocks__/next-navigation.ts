// __mocks__/next-navigation.ts — Next.js navigation mock for tests
export const useRouter = () => ({
  push: jest.fn(), replace: jest.fn(), back: jest.fn(),
  forward: jest.fn(), prefetch: jest.fn(), refresh: jest.fn(),
});
export const useParams = () => ({});
export const useSearchParams = () => new URLSearchParams();
export const usePathname = () => "/";
export const redirect = jest.fn();
export const notFound = jest.fn();
