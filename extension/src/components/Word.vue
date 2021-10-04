<template>
  <span>
    <span style="color:yellow; display:block">
      {{ wordList.find(w => w.id===wordId).wordText }}
    </span>
    <span style="color:white; display:inline-block">
      {{ wordList.find(w => w.id===wordId).wordText }}
    </span>
  </span>
</template>
