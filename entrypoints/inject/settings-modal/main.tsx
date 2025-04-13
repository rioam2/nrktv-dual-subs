import ReactDOM from 'react-dom/client';

import { SETTINGS_MODAL_QUERY_SELECTOR } from '@/constants/selectors';
import { Settings } from './Settings';

const rootId = 'nrktv-dual-subs-settings';

export const settingsModal = {
  mount: () => {
    const modal = document.querySelector(SETTINGS_MODAL_QUERY_SELECTOR);
    if (!modal) return;
    const settingsRoot = document.createElement('div');
    settingsRoot.setAttribute('id', rootId);
    modal.appendChild(settingsRoot);
    ReactDOM.createRoot(settingsRoot).render(<Settings />);
  },
  unmount: () => {
    const root = document.getElementById(rootId);
    if (root) root.remove();
  }
};
