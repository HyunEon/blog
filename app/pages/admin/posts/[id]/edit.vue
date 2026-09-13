<script setup lang="ts">
const route = useRoute()
const { data: post, error } = await useFetch(() => `/api/admin/posts/${String(route.params.id)}`)
if (error.value) throw createError({ statusCode: error.value.statusCode || 500, statusMessage: 'Post unavailable' })
useSeoMeta({ title: '글 수정 · 기록', robots: 'noindex, nofollow' })
</script>
<template><section><h1 class="mb-8 text-2xl font-semibold">글 수정</h1><PostEditor v-if="post" :key="post.id" :post="post" /></section></template>
