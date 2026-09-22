<script setup lang="ts">
import type { Post } from '../../shared/types'
const ready = ref(false)
onMounted(() => { ready.value = true })
const props = defineProps<{ post?: Post }>()
const { data: categories } = await useFetch('/api/admin/categories')
const form = reactive({ title: props.post?.title || '', slug: props.post?.slug || '', excerpt: props.post?.excerpt || '', content: props.post?.content || '', category: props.post?.category_id || 'none', status: props.post?.status || 'draft' })
const editorTab = ref('write')
const editorReady = ref(false)
const contentEditor = ref<{ getMarkdown: () => string; focus: () => void } | null>(null)
watch(editorTab, () => {
  if (contentEditor.value) form.content = contentEditor.value.getMarkdown()
})
const saving = ref(false)
const message = ref('')
async function save() {
  if (!editorReady.value || saving.value) return
  // Read synchronously so a save immediately after typing cannot miss the last edit.
  if (contentEditor.value) form.content = contentEditor.value.getMarkdown()
  if (!form.content.trim()) {
    editorTab.value = 'write'
    message.value = '본문을 입력해 주세요.'
    await nextTick()
    contentEditor.value?.focus()
    return
  }
  if (form.content.length > 100000) {
    message.value = '본문은 100,000자 이내로 작성해 주세요.'
    return
  }
  saving.value = true
  message.value = ''
  const data = { title: form.title, slug: form.slug, excerpt: form.excerpt, content: form.content, category_id: form.category === 'none' ? null : form.category, status: form.status }
  try {
    if (props.post) await $fetch(`/api/admin/posts/${props.post.id}`, { method: 'PUT', body: data })
    else await $fetch('/api/admin/posts', { method: 'POST', body: data })
    await navigateTo('/admin/posts')
  }
  catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    message.value = status === 409 ? '이미 사용 중인 주소입니다. 다른 주소를 입력해 주세요.' : '저장하지 못했습니다. 입력값과 인증 상태를 확인해 주세요.'
  }
  finally { saving.value = false }
}
</script>
<template>
  <form @submit.prevent="save" @input="message = ''">
    <fieldset :disabled="!ready || saving" class="min-w-0 space-y-6">
      <div class="space-y-2"><Label for="title">제목</Label><Input id="title" v-model="form.title" required maxlength="200" /></div>
      <div class="space-y-2"><Label for="slug">주소</Label><Input id="slug" v-model="form.slug" required maxlength="120" pattern="[a-z0-9]+(-[a-z0-9]+)*" aria-describedby="slug-help" /><p id="slug-help" class="text-xs text-muted-foreground">영문 소문자, 숫자, 하이픈을 사용합니다. 예: my-first-post</p></div>
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="space-y-2"><Label for="category">카테고리</Label><Select v-model="form.category"><SelectTrigger id="category"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">미분류</SelectItem><SelectItem v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label for="status">공개 상태</Label><Select v-model="form.status"><SelectTrigger id="status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">초안</SelectItem><SelectItem value="published">공개</SelectItem></SelectContent></Select></div>
      </div>
      <div class="space-y-2"><Label for="excerpt">요약 (선택)</Label><Textarea id="excerpt" v-model="form.excerpt" maxlength="500" :rows="2" aria-describedby="excerpt-help" /><p id="excerpt-help" class="text-xs text-muted-foreground">목록 소개문, 상세 페이지 도입문, 검색엔진 설명에 사용합니다. 비워도 저장할 수 있습니다.</p></div>
      <div class="space-y-2">
        <Label for="content">본문</Label>
        <Tabs v-model="editorTab">
          <TabsList aria-label="본문 편집 모드">
            <TabsTrigger value="write">작성</TabsTrigger>
            <TabsTrigger value="preview">미리보기</TabsTrigger>
          </TabsList>
          <TabsContent v-show="editorTab === 'write'" value="write" force-mount>
            <ClientOnly>
              <MilkdownEditor ref="contentEditor" v-model="form.content" :disabled="saving" @ready="editorReady = $event" />
              <template #fallback><p role="status" class="py-8 text-sm text-muted-foreground">편집기를 불러오는 중…</p></template>
            </ClientOnly>
          </TabsContent>
          <TabsContent value="preview">
            <MarkdownContent v-if="form.content.trim()" :source="form.content" />
            <p v-else class="py-8 text-sm text-muted-foreground">작성한 본문이 여기에 표시됩니다.</p>
          </TabsContent>
        </Tabs>
        <p id="content-help" class="text-xs text-muted-foreground">Milkdown으로 작성합니다. / 메뉴 또는 텍스트 선택으로 서식을 편집하세요. Markdown으로 저장하며 이미지 파일 업로드는 지원하지 않습니다.</p>
      </div>
      <p v-if="message" role="alert" class="text-sm">{{ message }}</p>
      <div class="flex gap-3"><Button type="submit" :disabled="saving || !editorReady">{{ saving ? '저장 중…' : '저장' }}</Button><Button as-child variant="outline"><NuxtLink to="/admin/posts">취소</NuxtLink></Button></div>
      <p class="text-xs text-muted-foreground">공개 화면에는 변경 내용이 최대 60초 뒤 반영될 수 있습니다.</p>
    </fieldset>
  </form>
</template>
