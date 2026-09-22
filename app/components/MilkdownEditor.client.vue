<script setup lang="ts">
import { Crepe } from '@milkdown/crepe'
import { editorViewCtx, editorViewOptionsCtx } from '@milkdown/kit/core'
import { uploadConfig } from '@milkdown/kit/plugin/upload'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

const props = defineProps<{ modelValue: string; disabled?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'ready': [value: boolean]
}>()
const root = ref<HTMLElement | null>(null)
const error = ref(false)
let crepe: Crepe | undefined
let created = false
let disposed = false

function getMarkdown() {
  return created && crepe ? crepe.getMarkdown() : props.modelValue
}
function focus() {
  if (created) crepe?.editor.action(ctx => ctx.get(editorViewCtx).focus())
}
defineExpose({ getMarkdown, focus })

onMounted(async () => {
  try {
    // Nuxt's client-only wrapper renders its DOM on the next update.
    await nextTick()
    if (disposed) return
    if (!root.value) throw new Error('Editor container unavailable')
    crepe = new Crepe({
      root: root.value,
      defaultValue: props.modelValue,
      features: {
        [Crepe.Feature.Latex]: false,
        [Crepe.Feature.ImageBlock]: false,
        [Crepe.Feature.AI]: false,
      },
    })
    crepe.editor.config((ctx) => {
      ctx.update(editorViewOptionsCtx, options => ({
        ...options,
        attributes: { id: 'content', role: 'textbox', 'aria-label': '본문', 'aria-multiline': 'true', 'aria-required': 'true', 'aria-describedby': 'content-help' },
      }))
      // There is no upload storage: never save temporary blob URLs in D1.
      ctx.update(uploadConfig.key, options => ({ ...options, uploader: async () => [] }))
    })
    crepe.on(listener => listener.markdownUpdated((_ctx, markdown) => {
      if (!disposed) emit('update:modelValue', markdown)
    }))
    await crepe.create()
    if (disposed) { await crepe.destroy(); return }
    created = true
    crepe.setReadonly(Boolean(props.disabled))
    emit('ready', true)
  }
  catch {
    error.value = true
    emit('ready', false)
  }
})
watch(() => props.disabled, value => {
  if (created) crepe?.setReadonly(Boolean(value))
})
onBeforeUnmount(() => {
  disposed = true
  emit('ready', false)
  if (created) void crepe?.destroy()
})
</script>

<template>
  <div class="min-w-0 max-w-full">
    <p v-if="error" role="alert" class="text-sm">편집기를 불러오지 못했습니다. 페이지를 새로고침해 주세요. 본문은 저장되지 않았습니다.</p>
    <div ref="root" class="min-w-0" />
  </div>
</template>

<style scoped>
/* User-approved mobile spacing adjustment; keep the bundled theme otherwise. */
@media (max-width: 640px) {
  :deep(.milkdown .ProseMirror) {
    padding: 24px 32px;
  }
}
</style>
