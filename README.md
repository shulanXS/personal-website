# AstroPaper 📄

![AstroPaper](public/default-og.jpg)
[![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/community/file/1356898632249991861)
![Typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![GitHub](https://img.shields.io/github/license/satnaing/astro-paper?color=%232F3741&style=for-the-badge)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white&style=for-the-badge)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=for-the-badge)](http://commitizen.github.io/cz-cli/)

AstroPaper is a minimal, responsive, accessible and SEO-friendly Astro blog theme. This theme is designed and crafted based on [my personal blog](https://satnaing.dev/blog).

Read [the blog posts](https://astro-paper.pages.dev/posts/) or check [the README Documentation Section](#-documentation) for more info.

## 🔥 Features

- [x] type-safe markdown
- [x] super fast performance
- [x] accessible (Keyboard/VoiceOver)
- [x] responsive (mobile ~ desktops)
- [x] SEO-friendly
- [x] light & dark mode
- [x] static search ([Pagefind](https://pagefind.app/))
- [x] draft posts & pagination
- [x] sitemap & rss feed
- [x] MDX support
- [x] collapsible table of contents
- [x] followed best practices
- [x] highly customizable
- [x] dynamic OG image generation for blog posts ([Blog Post](https://astro-paper.pages.dev/posts/dynamic-og-image-generation-in-astropaper-blog-posts/))
- [x] i18n ready

_Note: I've tested screen-reader accessibility of AstroPaper using **VoiceOver** on Mac and **TalkBack** on Android. I couldn't test all other screen-readers out there. However, accessibility enhancements in AstroPaper should be working fine on others as well._

## ✅ Lighthouse Score

<p align="center">
  <a href="https://pagespeed.web.dev/report?url=https%3A%2F%2Fastro-paper.pages.dev%2F&form_factor=desktop">
    <img width="710" alt="AstroPaper Lighthouse Score" src="AstroPaper-lighthouse-score.svg">
  </a>
</p>

## 🚀 Project Structure

Inside of AstroPaper, you'll see the following folders and files:

```bash
/
├── public/
│   ├── pagefind/          # auto-generated on build
│   ├── favicon.svg
│   └── default-og.jpg
├── src/
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   ├── components/
│   ├── content/
│   │   ├── pages/
│   │   │   └── about.md
│   │   └── posts/
│   │       └── some-blog-posts.md
│   ├── i18n/
│   ├── layouts/
│   ├── pages/
│   ├── scripts/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── config.ts
│   └── content.config.ts
├── astro-paper.config.ts  # user-defined configurations
└── astro.config.ts
```

All blog posts are stored in the `src/content/posts/` directory. You can organise posts into subdirectories — the subdirectory name becomes part of the post URL.

## 📖 Documentation

Documentation can be read in two formats\_ _markdown_ & _blog post_.

- Configuration - [markdown](src/content/posts/how-to-configure-astropaper-theme.md) | [blog post](https://astro-paper.pages.dev/posts/how-to-configure-astropaper-theme/)
- Add Posts - [markdown](src/content/posts/adding-new-post.md) | [blog post](https://astro-paper.pages.dev/posts/adding-new-posts-in-astropaper-theme/)
- Customize Color Schemes - [markdown](src/content/posts/customizing-astropaper-theme-color-schemes.md) | [blog post](https://astro-paper.pages.dev/posts/customizing-astropaper-theme-color-schemes/)
- Predefined Color Schemes - [markdown](src/content/posts/predefined-color-schemes.md) | [blog post](https://astro-paper.pages.dev/posts/predefined-color-schemes/)

## 💻 Tech Stack

**Main Framework** - [Astro](https://astro.build/)  
**Type Checking** - [TypeScript](https://www.typescriptlang.org/)  
**Styling** - [TailwindCSS](https://tailwindcss.com/)  
**UI/UX** - [Figma Design File](https://www.figma.com/community/file/1356898632249991861)  
**Static Search** - [Pagefind](https://pagefind.app/)  
**Icons** - [Tablers](https://tabler-icons.io/)  
**Code Formatting** - [Prettier](https://prettier.io/)  
**Deployment** - [Cloudflare Pages](https://pages.cloudflare.com/)  
**Linting** - [ESLint](https://eslint.org)  
**Dynamic OG images** - [Satori](https://github.com/vercel/satori) + [Sharp](https://sharp.pixelplumbing.com/) + [Astro Fonts](https://docs.astro.build/en/guides/fonts/)

## 👨🏻‍💻 Running Locally

You can start using this project locally by running the following command in your desired directory:

```bash
# pnpm
pnpm create astro@latest --template satnaing/astro-paper

# npm
npm create astro@latest -- --template satnaing/astro-paper

# yarn
yarn create astro --template satnaing/astro-paper

# bun
bun create astro@latest -- --template satnaing/astro-paper
```

Then start the project by running the following commands:

```bash
# install dependencies if you haven't done so in the previous step.
pnpm install

# start running the project
pnpm dev
```

## Google Site Verification (optional)

You can add your [Google Site Verification HTML tag](https://support.google.com/webmasters/answer/9008080#meta_tag_verification&zippy=%2Chtml-tag) by setting `site.googleVerification` in `astro-paper.config.ts`:

```ts file="astro-paper.config.ts"
export default defineAstroPaperConfig({
  site: {
    // ...
    googleVerification: "your-google-site-verification-value",
  },
  // ...
});
```

> See [this discussion](https://github.com/satnaing/astro-paper/discussions/334#discussioncomment-10139247) for adding AstroPaper to the Google Search Console.

## 📝 在后台发布内容（Pages CMS）

本站的内容通过 [Pages CMS](https://pagescms.org/) 管理，**不需要本地编辑器，也不需要手动 `git push`**。项目根目录的 [`.pages.yml`](.pages.yml) 已经把四个内容集合映射成了可编辑的表单。

### 发布流程

1. 打开 <https://app.pagescms.org/>，用 GitHub 账号登录并授权本站仓库。
2. 在左侧选择内容类型：`Blog`（技术文章）、`Notes`（碎碎念）、`Writing`（文学创作）、`Projects`（项目）。
3. 编辑内容 → 点击 **Save / Publish**。Pages CMS 会把改动提交到 GitHub。
4. GitHub 的提交触发 Cloudflare Pages 重新构建，站点随即更新。

> 静态站点的内容更新**不是即时的**，需要等一次构建完成（通常一两分钟）。

### 四个集合的要点

| 集合     | 路径                     | 文件名模板         | 说明                                                               |
| -------- | ------------------------ | ------------------ | ------------------------------------------------------------------ |
| Blog     | `src/content/posts`      | `{fields.slug}.md` | URL 为 `/posts/{slug}/`。文件名即 URL，**slug 一旦发布就不要改**。 |
| Notes    | `src/content/notes`      | `{fields.id}.md`   | `id` 是自动生成的 UUID，链接永不变动。标题可留空，可以只发图片。   |
| Writing  | `src/content/writing`    | `{fields.slug}.md` | URL 为 `/writing/{slug}/`。                                        |
| Projects | `src/data/projects.json` | —                  | 整个 JSON 文件是一个表单，`order` 小的排前面。                     |

### 注意事项

- **MDX 文件不在 CMS 中**：MDX 正文含 JSX 组件，CMS 的富文本编辑器会破坏它们。`src/content/posts/*.mdx` 只能在本地编辑。
- **格式会被规范化**：CMS 读取文件后会重新序列化整个 frontmatter，键序、引号风格和空行不会保留。内容不会丢失，但**不要依赖具体的 YAML 排版**。
- **图片上传到 `public/uploads/`**，文件名会被随机重命名。Markdown 里写 `/uploads/xxx.png` 这样的绝对路径。
- **草稿不是保密机制**：仓库公开时，草稿源文件仍能在 GitHub 上看到。

### 图片上传失败的两种原因

Pages CMS 把图片当作一次 JSON 请求发出去，请求体里装着 base64 编码的图片。因此有两道坎：

1. **体积上限。** 托管版 CMS 的请求体上限约 4.3 MB，而 base64 会把图片撑大三分之一，所以**原图必须小于 3.2 MB**。手机照片通常远大于此，上传会直接失败（`FUNCTION_PAYLOAD_TOO_LARGE`），仓库里什么都不会留下。
2. **并发抢占。** 一次选中多张图时，CMS 会并发上传，每张都是一次独立的提交，于是它们互相抢占分支头，只有一张能成功，其余报 `is at <sha> but expected <sha>`。**一次传一张**即可。

预置脚本会把照片压到能上传的大小，并把 HEIC / AVIF 转成 CMS 接受的格式：

```bash
npm run image:prepare -- ~/Pictures/IMG_1234.HEIC
# -> ~/Pictures/IMG_1234.jpg  2000x1333 jpeg, 8 MB -> 715 KB
```

然后在 CMS 里上传生成的 `.jpg` 就行。

> `HEIC` 转换依赖 `ffmpeg`（已解码 HEVC）。`AVIF` 可由 sharp 直接读取，无需额外依赖。

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                        | Action                                                                                                                            |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                 | Installs dependencies                                                                                                             |
| `pnpm dev`                     | Starts local dev server at `localhost:4321`                                                                                       |
| `pnpm build`                   | Type-checks, builds the site, runs Pagefind indexing, and copies the index to `public/pagefind/`                                  |
| `pnpm preview`                 | Preview your build locally, before deploying                                                                                      |
| `pnpm sync`                    | Generates TypeScript types for all Astro modules. [Learn more](https://docs.astro.build/en/reference/cli-reference/#astro-sync).  |
| `pnpm astro ...`               | Run CLI commands like `astro add`, `astro check`                                                                                  |
| `pnpm image:prepare -- <file>` | Prepares an image for upload to Pages CMS: converts HEIC/AVIF to JPEG, scales it down, and compresses it under the CMS size limit |

## ✨ Feedback & Suggestions

If you have any suggestions/feedback, you can contact me via [my email](mailto:satnaingdev+astropaper@gmail.com). Alternatively, feel free to open an issue if you find bugs or want to request new features.

## 📜 License

Licensed under the MIT License, Copyright © 2026

---

Made with 🤍 by [Sat Naing](https://satnaing.dev) 👨🏻‍💻 and [contributors](https://github.com/satnaing/astro-paper/graphs/contributors).
