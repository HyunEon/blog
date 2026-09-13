<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
</script>
<template>
  <main class="mx-auto max-w-xl px-6 py-24">
    <h1 class="text-2xl font-semibold">{{ error.statusCode === 404 ? '페이지를 찾을 수 없습니다.' : error.statusCode === 401 ? '관리자 인증이 필요합니다.' : '페이지를 불러오지 못했습니다.' }}</h1>
    <p class="mt-4 text-muted-foreground">{{ error.statusCode === 401 ? '설정된 Cloudflare Access 주소로 접속해 주세요.' : '주소를 확인하거나 잠시 뒤 다시 시도해 주세요.' }}</p>
    <Button class="mt-8" @click="clearError({ redirect: '/' })">홈으로</Button>
  </main>
</template>
