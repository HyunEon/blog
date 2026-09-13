import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['app/components/ui/**', '.wrangler/**', 'test-results/**', 'playwright-report/**'],
}, {
  rules: { 'vue/multi-word-component-names': 'off', 'vue/max-attributes-per-line': 'off', 'vue/html-self-closing': 'off', 'vue/singleline-html-element-content-newline': 'off' },
})
