<script setup lang="ts">
const route = useRoute()
const { data: categories } = await useFetch('/api/categories')
const category = computed(() => categories.value?.find(item => item.slug === route.params.slug))
if (!category.value) throw createError({ statusCode: 404, statusMessage: 'Category not found' })
useSeoMeta({ title: () => `${category.value?.name} · 기록` })
</script>

<template><PostList :key="String(route.params.slug)" :category="String(route.params.slug)" :title="category?.name || '카테고리'" /></template>
