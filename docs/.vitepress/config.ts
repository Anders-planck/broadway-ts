import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Broadway TS",
  description:
    "TypeScript-first CQRS and Event Sourcing toolkit inspired by Broadway for PHP.",
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ["superpowers/**/*.md"],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Reference", link: "/reference/core" },
      { text: "Roadmap", link: "/roadmap" },
    ],
    sidebar: [
      {
        text: "Start",
        items: [
          { text: "Overview", link: "/" },
          { text: "Getting Started", link: "/getting-started" },
          { text: "Documentation Strategy", link: "/documentation-strategy" },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "Command and Query Bus", link: "/guides/command-query-bus" },
          { text: "Event Sourcing", link: "/guides/event-sourcing" },
          { text: "Testing", link: "/guides/testing" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "Architecture", link: "/concepts/architecture" },
          { text: "Errors and Results", link: "/concepts/errors-and-results" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Core", link: "/reference/core" },
          { text: "Event Sourcing", link: "/reference/event-sourcing" },
          { text: "Zod", link: "/reference/zod" },
          { text: "Testing", link: "/reference/testing" },
          { text: "Postgres", link: "/reference/postgres" },
        ],
      },
      {
        text: "Project",
        items: [{ text: "Roadmap", link: "/roadmap" }],
      },
    ],
    search: {
      provider: "local",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/Anders-planck/broadway-ts" },
    ],
    editLink: {
      pattern:
        "https://github.com/Anders-planck/broadway-ts/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright (c) 2026 Anders-planck",
    },
  },
});
