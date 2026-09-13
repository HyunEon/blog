<script setup lang="ts">
defineProps<{ title: string; disabled?: boolean }>()
const emit = defineEmits<{ confirm: [] }>()
</script>
<template>
  <AlertDialog>
    <AlertDialogTrigger as-child><Button variant="outline" size="sm" :disabled="disabled">삭제</Button></AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>글을 삭제할까요?</AlertDialogTitle>
        <AlertDialogDescription>‘{{ title }}’ 글이 영구적으로 삭제됩니다.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction @click="emit('confirm')">삭제 확인</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
