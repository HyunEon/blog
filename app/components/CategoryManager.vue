<script setup lang="ts">
import type { Category } from '../../shared/types'
const ready = ref(false)
onMounted(() => { ready.value = true })
const { data: categories, error, refresh } = await useFetch('/api/admin/categories')
const form = reactive({ name: '', slug: '' })
const editing = ref<string | null>(null)
const busy = ref(false)
const message = ref('')
function reset() { editing.value = null; form.name = ''; form.slug = '' }
function edit(category: Category) { editing.value = category.id; form.name = category.name; form.slug = category.slug }
async function save() {
  busy.value = true
  message.value = ''
  try {
    if (editing.value) await $fetch(`/api/admin/categories/${editing.value}`, { method: 'PUT', body: form })
    else await $fetch('/api/admin/categories', { method: 'POST', body: form })
    reset(); await refresh()
  }
  catch { message.value = '저장하지 못했습니다. 주소 중복과 입력값을 확인해 주세요.' }
  finally { busy.value = false }
}
async function remove(id: string) {
  busy.value = true
  message.value = ''
  try { await $fetch(`/api/admin/categories/${id}`, { method: 'DELETE' }); if (editing.value === id) reset(); await refresh() }
  catch { message.value = '카테고리를 삭제하지 못했습니다.' }
  finally { busy.value = false }
}
</script>
<template>
  <section aria-labelledby="category-heading">
    <h2 id="category-heading" class="mb-5 text-lg font-semibold">카테고리 관리</h2>
    <p v-if="error" role="alert">카테고리를 불러오지 못했습니다.</p>
    <ul class="mb-6 divide-y">
      <li v-for="category in categories" :key="category.id" class="flex flex-wrap items-center justify-between gap-2 py-3">
        <span>{{ category.name }} <span class="text-xs text-muted-foreground">/{{ category.slug }}</span></span>
        <div class="flex gap-2"><Button variant="ghost" size="sm" :disabled="busy" @click="edit(category)">수정</Button>
          <AlertDialog><AlertDialogTrigger as-child><Button variant="ghost" size="sm" :disabled="busy">삭제</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>카테고리를 삭제할까요?</AlertDialogTitle><AlertDialogDescription>‘{{ category.name }}’의 글은 미분류로 남습니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction @click="remove(category.id)">삭제 확인</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
      </li>
    </ul>
    <form @submit.prevent="save">
      <fieldset :disabled="!ready || busy" class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2"><div class="space-y-2"><Label for="category-name">카테고리 이름</Label><Input id="category-name" v-model="form.name" required maxlength="60" /></div><div class="space-y-2"><Label for="category-slug">카테고리 주소</Label><Input id="category-slug" v-model="form.slug" required maxlength="120" pattern="[a-z0-9]+(-[a-z0-9]+)*" /></div></div>
      <p v-if="message" role="alert" class="text-sm">{{ message }}</p>
      <div class="flex gap-2"><Button type="submit" variant="outline" :disabled="busy">{{ editing ? '카테고리 저장' : '카테고리 추가' }}</Button><Button v-if="editing" type="button" variant="ghost" @click="reset">취소</Button></div>
    </fieldset>
    </form>
  </section>
</template>
