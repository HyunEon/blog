<script setup lang="ts">
useSeoMeta({ title: '글 관리 · 기록', robots: 'noindex, nofollow' })
const route = useRoute()
const { data, error, refresh } = await useFetch('/api/admin/posts', { query: computed(() => ({ page: String(route.query.page || '1') })) })
const message = ref('')
const deleting = ref(false)
async function remove(id: string) {
  deleting.value = true
  message.value = ''
  try { await $fetch(`/api/admin/posts/${id}`, { method: 'DELETE' }); await refresh() }
  catch { message.value = '삭제하지 못했습니다. 다시 시도해 주세요.' }
  finally { deleting.value = false }
}
</script>
<template>
  <section>
    <div class="mb-8 flex items-center justify-between"><h1 class="text-2xl font-semibold">글 관리</h1><Button as-child><NuxtLink to="/admin/posts/new">새 글</NuxtLink></Button></div>
    <p v-if="error" role="alert">글을 불러오지 못했습니다. 인증 상태를 확인해 주세요.</p>
    <p v-if="message" role="alert">{{ message }}</p>
    <p v-if="data && !data.posts.length" class="py-8 text-muted-foreground">작성한 글이 없습니다.</p>
    <ul class="divide-y">
      <li v-for="post in data?.posts" :key="post.id" class="flex flex-wrap items-center justify-between gap-4 py-5">
        <div class="min-w-0 flex-1"><h2 class="break-words font-medium">{{ post.title }}</h2><p class="mt-1 text-xs text-muted-foreground">{{ post.status === 'draft' ? '초안' : '공개' }} · {{ post.updated_at.slice(0, 10) }}</p></div>
        <div class="flex gap-2"><Button as-child variant="outline" size="sm"><NuxtLink :to="`/admin/posts/${post.id}/edit`">수정</NuxtLink></Button><DeletePost :title="post.title" :disabled="deleting" @confirm="remove(post.id)" /></div>
      </li>
    </ul>
    <nav v-if="data && (data.page > 1 || data.hasMore)" class="mt-6 flex gap-3" aria-label="관리 목록 페이지">
      <Button v-if="data.page > 1" as-child variant="outline"><NuxtLink :to="{ query: { page: data.page - 1 } }">이전</NuxtLink></Button>
      <Button v-if="data.hasMore" as-child variant="outline"><NuxtLink :to="{ query: { page: data.page + 1 } }">다음</NuxtLink></Button>
    </nav>
    <Separator class="my-12" />
    <CategoryManager />
  </section>
</template>
