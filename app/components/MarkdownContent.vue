<script setup lang="ts">
import { renderMarkdown } from '../lib/markdown'

const props = defineProps<{ source: string }>()
const html = computed(() => renderMarkdown(props.source))
</script>

<template>
  <!-- Only the shared Markdown parser produces this HTML; source HTML is disabled. -->
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="prose prose-neutral max-w-none overflow-x-auto break-words" v-html="html" />
</template>
