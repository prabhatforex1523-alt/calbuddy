import './index.css';

const rootElement = document.getElementById('root');

const getErrorDetail = (error: unknown) => {
  if (error instanceof Error) {
    return error.message || error.name || 'Unknown startup error';
  }

  return String(error);
};

const renderBootstrapMessage = (title: string, message: string, detail?: string) => {
  if (!rootElement) {
    return;
  }

  rootElement.innerHTML = `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/95 px-6 py-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:border-[#22322d] dark:bg-[#0d1916]/95">
        <p class="text-xs font-bold uppercase tracking-[0.3em] text-[#8b7e66]">CALSNAP AI</p>
        <h1 class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">${title}</h1>
        <p class="mt-3 text-sm text-slate-600 dark:text-slate-300">${message}</p>
        ${
          detail
            ? `<p class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600 dark:border-[#22322d] dark:bg-[#10211c]/80 dark:text-slate-300">${detail}</p>`
            : ''
        }
      </div>
    </div>
  `;
};

renderBootstrapMessage('Opening CALSNAP AI', 'Preparing your dashboard...');

const bootstrap = async () => {
  if (!rootElement) {
    throw new Error('App root element not found.');
  }

  const { mountApp } = await import('./bootstrap');
  mountApp(rootElement);
};

void bootstrap().catch((error) => {
  console.error('App bootstrap failed:', error);
  renderBootstrapMessage(
    'App failed to start',
    'A startup problem was detected on this device. Reinstall the latest APK and try again.',
    getErrorDetail(error)
  );
});
