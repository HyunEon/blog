<script setup lang="ts">
const route = useRoute()
const { data: post, error } = await useFetch(() => `/api/posts/${String(route.params.slug)}`)
if (error.value) throw createError({ statusCode: error.value.statusCode || 500, statusMessage: 'Post unavailable' })
useSeoMeta({ title: () => `${post.value?.title || '글'} · 기록`, description: () => post.value?.excerpt })
</script>

<template>
  <article v-if="post">
    <div class="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
      <time :datetime="post.created_at">{{ post.created_at.slice(0, 10) }}</time>
      <Button v-if="post.category_slug" as-child variant="link" class="h-auto p-0"><NuxtLink :to="`/category/${post.category_slug}`">{{ post.category_name }}</NuxtLink></Button>
    </div>
    <h1 class="break-words text-3xl leading-snug font-semibold tracking-tight">{{ post.title }}</h1>
    <p v-if="post.excerpt" class="mt-4 leading-7 text-muted-foreground">{{ post.excerpt }}</p>
    <Separator class="my-8" />
    <div class="whitespace-pre-wrap break-words text-base leading-8">{{ post.content }}</div>
    <Button as-child variant="outline" class="mt-12"><NuxtLink to="/">목록으로</NuxtLink></Button>
  </article>
</template>
