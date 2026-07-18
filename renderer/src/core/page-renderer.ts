import { renderHome } from '../pages/home.js';
import { renderLibrary } from '../pages/library.js';
import { renderAccount } from '../pages/account.js';
import { renderCollectionDetail } from '../pages/detail.js';
import { renderSettings } from '../pages/settings.js';
import { renderSearch } from '../pages/search.js';
import { render404 } from '../pages/404.js';

function getContent(): HTMLElement {
  return document.getElementById('content')!;
}

export function renderPage(page: string): void {
  const container = getContent();

  if (page.startsWith('playlist/')) {
    const id = parseInt(page.split('/')[1]);
    if (id) {
      renderCollectionDetail(container, 'playlist', id);
      return;
    }
  }

  if (page.startsWith('album/')) {
    const id = parseInt(page.split('/')[1]);
    if (id) {
      renderCollectionDetail(container, 'album', id);
      return;
    }
  }

  if (page.startsWith('search')) {
    const query = new URLSearchParams(page.split('?')[1] || '').get('q') || '';
    renderSearch(container, query);
    return;
  }

  if (page.startsWith('settings')) {
    renderSettings(container);
    return;
  }

  switch (page) {
    case 'home':
      renderHome(container);
      break;
    case 'library':
      renderLibrary(container);
      break;
    case 'account':
      renderAccount(container);
      break;
    default:
      render404(container);
      break;
  }
}