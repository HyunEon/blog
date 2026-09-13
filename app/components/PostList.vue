<script setup lang="ts">
const props = defineProps<{ category?: string; title: string }>()
const route = useRoute()
const page = computed(() => String(route.query.page || '1'))
const { data, status, error, refresh } = await useFetch('/api/posts', { query: computed(() => ({ page: page.value, category: props.category })) })
</script>

<template>
  <section>
    <h1 class="mb-8 text-xl font-semibold">{{ title }}</h1>
    <div v-if="error" role="alert" class="space-y-3">
      <p>글을 불러오지 못했습니다.</p>
      <Button variant="outline" @click="refresh()">다시 시도</Button>
    </div>
    <p v-else-if="status === 'pending'" role="status" class="text-muted-foreground">불러오는 중…</p>
    <template v-else>
      <p v-if="!data?.posts.length" class="py-12 text-muted-foreground">아직 공개된 글이 없습니다.</p>
      <ol v-else class="divide-y">
        <li v-for="post in data.posts" :key="post.id" class="py-7 first:pt-0">
          <div class="mb-2 flex gap-3 text-xs text-muted-foreground">
            <time :datetime="post.created_at">{{ post.created_at.slice(0, 10) }}</time>
            <span v-if="post.category_name">{{ post.category_name }}</span>
          </div>
          <h2><Button as-child variant="link" class="h-auto max-w-full justify-start whitespace-normal p-0 text-left text-lg font-medium"><NuxtLink :to="`/posts/${post.slug}`">{{ post.title }}</NuxtLink></Button></h2>
          <p v-if="post.excerpt" class="mt-2 break-words text-sm leading-7 text-muted-foreground">{{ post.excerpt }}</p>
        </li>
      </ol>
      <nav v-if="data && (data.page > 1 || data.hasMore)" aria-label="페이지 이동" class="mt-8 flex items-center justify-between">
        <Button as-child variant="outline" :disabled="data.page === 1"><NuxtLink :to="{ query: { page: Math.max(1, data.page - 1) } }">이전</NuxtLink></Button>
        <span class="text-sm">{{ data.page }} 페이지</span>
        <Button as-child variant="outline" :disabled="!data.hasMore"><NuxtLink :to="{ query: { page: data.page + 1 } }">다음</NuxtLink></Button>
      </nav>
    </template>
  </section>
</template>
