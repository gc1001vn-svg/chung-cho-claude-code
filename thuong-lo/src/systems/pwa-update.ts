import { registerSW } from 'virtual:pwa-register';

import { t } from './i18n';

/**
 * Service worker registration and the "a new build is available" prompt
 * (CLAUDE.md §3.1).
 *
 * The banner is plain DOM rather than a Phaser overlay on purpose: it has to
 * work whatever scene is running, including a scene that failed to start.
 *
 * In dev there is no service worker (`devOptions.enabled: false`), so
 * `registerSW` resolves to a no-op and the banner simply never appears.
 */

interface BannerElements {
  readonly banner: HTMLElement;
  readonly text: HTMLElement;
  readonly reload: HTMLButtonElement;
  readonly dismiss: HTMLButtonElement;
}

function findBanner(): BannerElements | null {
  const banner = document.querySelector<HTMLElement>('#update-banner');
  const text = document.querySelector<HTMLElement>('#update-text');
  const reload = document.querySelector<HTMLButtonElement>('#update-reload');
  const dismiss = document.querySelector<HTMLButtonElement>('#update-dismiss');

  if (!banner || !text || !reload || !dismiss) return null;
  return { banner, text, reload, dismiss };
}

export function setupPwaUpdatePrompt(): void {
  const elements = findBanner();
  if (!elements) return;

  const { banner, text, reload, dismiss } = elements;

  reload.textContent = t('update.reload');
  dismiss.setAttribute('aria-label', t('update.dismiss'));

  const hide = (): void => {
    banner.hidden = true;
  };

  const show = (message: string, showReload: boolean): void => {
    text.textContent = message;
    reload.hidden = !showReload;
    banner.hidden = false;
  };

  dismiss.addEventListener('click', hide);

  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      show(t('update.message'), true);
    },
    onOfflineReady() {
      // Confirms the precache finished — this is the moment the game is
      // genuinely playable with the network off.
      show(t('update.offline_ready'), false);
      window.setTimeout(hide, 6000);
    },
  });

  reload.addEventListener('click', () => {
    hide();
    void updateServiceWorker(true);
  });
}
