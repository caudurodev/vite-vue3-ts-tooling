<template>
  <span class="learnword" @click="isVisible=!isVisible">
    <span v-if="isVisible" style="color:pink; display:block">
      {{ wordList.find(w => w.id===wordId).wordText }}
    </span>
    <span :style="isVisible && 'color:white'" style="display:inline-block">
      {{ wordList.find(w => w.id===wordId).wordText }}
    </span>
  </span>
</template>
