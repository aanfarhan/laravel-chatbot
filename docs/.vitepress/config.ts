import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Laravel Chatbot',
  base: '/laravel-chatbot/',
  description: 'Context-aware chatbot package for Laravel: signed page context, OpenAI-compatible LLMs, streaming SSE, GDPR-friendly persistence.',
  lang: 'en-US',
  cleanUrls: true,

  // The repo's /docs folder also contains internal-only material we don't ship to the public site.
  srcExclude: [
    'agents/**',
    'README.md',
  ],

  head: [
    ['meta', { name: 'theme-color', content: '#6366f1' }],
  ],

  themeConfig: {
    siteTitle: 'Laravel Chatbot',

    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: 'Reference', link: '/reference/configuration', activeMatch: '/reference/' },
      { text: 'Decisions', link: '/decisions/', activeMatch: '/decisions/' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/aanfarhan/laravel-chatbot' },
          { text: 'Packagist', link: 'https://packagist.org/packages/aanfarhan/laravel-chatbot' },
          { text: 'Changelog', link: 'https://github.com/aanfarhan/laravel-chatbot/releases' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick start', link: '/guide/quickstart' },
          ],
        },
        {
          text: 'Concepts',
          items: [
            { text: 'Channels', link: '/guide/channels' },
            { text: 'Context', link: '/guide/context' },
            { text: 'Tool calling', link: '/guide/tool-calling' },
            { text: 'Threaded actor', link: '/guide/threaded-actor' },
            { text: 'Client extractors', link: '/guide/client-extractors' },
          ],
        },
        {
          text: 'Customisation',
          items: [
            { text: 'Theming', link: '/guide/theming' },
            { text: 'Testing', link: '/guide/testing' },
          ],
        },
        {
          text: 'Operations',
          items: [
            { text: 'GDPR & user data', link: '/guide/gdpr' },
            { text: 'Security', link: '/guide/security' },
            { text: 'SemVer commitments', link: '/guide/semver' },
            { text: 'Upgrading', link: '/guide/upgrading' },
          ],
        },
      ],

      '/reference/': [
        {
          text: 'PHP API',
          items: [
            { text: 'Configuration', link: '/reference/configuration' },
            { text: 'Chatbot facade', link: '/reference/facade' },
            { text: 'ChannelScope', link: '/reference/channel-scope' },
            { text: 'Contracts', link: '/reference/contracts' },
            { text: 'ToolInvocation', link: '/reference/tool-invocation' },
            { text: 'Events', link: '/reference/events' },
            { text: 'Exceptions', link: '/reference/exceptions' },
            { text: 'Testing helpers', link: '/reference/testing-helpers' },
            { text: 'Console commands', link: '/reference/console-commands' },
          ],
        },
        {
          text: 'HTTP & frontend',
          items: [
            { text: 'HTTP endpoints', link: '/reference/http-api' },
            { text: 'SSE events', link: '/reference/sse-events' },
            { text: 'Web component', link: '/reference/web-component' },
            { text: 'CSS theming', link: '/reference/css-theming' },
          ],
        },
      ],

      '/decisions/': [
        {
          text: 'Architecture decisions',
          items: [
            { text: 'Overview', link: '/decisions/' },
            { text: 'ADR-0001 — Global registry, per-channel allowlist', link: '/adr/0001-global-tool-registry-with-per-channel-allowlist' },
            { text: 'ADR-0002 — Persist invocations + freshness window', link: '/adr/0002-persist-tool-invocations-with-freshness-window' },
            { text: 'ADR-0003 — Threaded actor is a contract parameter', link: '/adr/0003-threaded-actor-is-a-contract-parameter' },
            { text: 'ADR-0004 — Client extractors: untrusted by construction', link: '/adr/0004-client-extractors-untrusted-by-construction' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/aanfarhan/laravel-chatbot' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/aanfarhan/laravel-chatbot/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025–present Aan Farhan',
    },

    outline: [2, 3],
  },
})
