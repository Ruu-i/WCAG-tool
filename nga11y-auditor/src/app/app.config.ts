import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

const KEPT_LANGUAGES = new Set(['html', 'typescript', 'javascript', 'css', 'plaintext', 'json']);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideMonacoEditor({
      baseUrl: 'assets',
      defaultOptions: { scrollBeyondLastLine: false },
      onMonacoLoad: () => {
        const monaco = (window as any).monaco;
        if (!monaco) return;
        // Unregister all languages we don't need — saves ~800KB from the bundle
        monaco.languages.getLanguages()
          .filter((lang: any) => !KEPT_LANGUAGES.has(lang.id))
          .forEach((lang: any) => {
            try {
              monaco.languages.register({ id: lang.id, extensions: [] });
            } catch { /* ignore */ }
          });
      },
    }),
  ],
};

