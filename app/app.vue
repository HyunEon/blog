<script setup lang="ts">
const { data: categories, error } = await useFetch('/api/categories')
const route = useRoute()
</script>

<template>
  <div class="grid min-h-screen grid-cols-[minmax(1rem,1fr)_minmax(0,48rem)_minmax(1rem,1fr)]">
    <aside aria-hidden="true" />
    <div class="flex min-w-0 flex-col">
      <header class="pt-16 pb-8 sm:pt-24">
        <Button as-child variant="link" class="h-auto p-0 text-3xl font-semibold tracking-tight"><NuxtLink to="/">기록</NuxtLink></Button>
        <p class="mt-3 text-sm text-muted-foreground">개발하며 배운 것들을 기록합니다.</p>
      </header>
      <nav aria-label="카테고리" class="flex flex-wrap gap-1 pb-5">
        <Button as-child :variant="route.path === '/' ? 'secondary' : 'ghost'" size="sm"><NuxtLink to="/">전체</NuxtLink></Button>
        <Button v-for="category in categories" :key="category.id" as-child :variant="route.path === `/category/${category.slug}` ? 'secondary' : 'ghost'" size="sm">
          <NuxtLink :to="`/category/${category.slug}`">{{ category.name }}</NuxtLink>
        </Button>
        <p v-if="error" role="alert" class="text-sm">카테고리를 불러오지 못했습니다.</p>
      </nav>
      <Separator />
      <main id="main" class="min-w-0 flex-1 py-10"><NuxtPage /></main>
      <footer class="mt-12 border-t py-8 text-sm text-muted-foreground">
        <div class="flex items-center justify-between">
          <span>기록</span>
          <Button as-child variant="ghost" size="sm"><a href="/admin">관리</a></Button>
        </div>
      </footer>
    </div>
    <aside aria-hidden="true" />
  </div>
</template>
