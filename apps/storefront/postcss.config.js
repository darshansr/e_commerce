/**
 * PostCSS config — required for Tailwind to be processed by Next.js.
 *
 * Without this file Next ships the raw `@tailwind base/components/utilities`
 * directives to the browser, which it ignores, so the entire site renders
 * completely unstyled.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
