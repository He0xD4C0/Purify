import { router } from './router.js';

export function registerRoutes(navigateTo: (page: string) => void): void {
  router.register('home', () => navigateTo('home'));
  router.register('library', () => navigateTo('library'));
  router.register('account', () => navigateTo('account'));
  router.register('settings', () => navigateTo('settings'));
  router.register('search', () => navigateTo(router.current()));
  router.register('playlist', () => navigateTo(router.current()));
  router.register('album', () => navigateTo(router.current()));
  router.register('404', () => navigateTo('404'));
}