<template>
  <div class="content">
    <h1>[vitesse-webext] s Mouse Position: x: {{ x }} y: {{ y }}</h1>
    <Test />
  </div>
</template>

<script setup lang="ts">
import Test from '../components/Test.vue'
import { useMouse } from './useMouse'

const props = defineProps({ globalWindow: Window })
const { x, y } = useMouse({ window: props.globalWindow })
</script>

<style>
.content h1 {
  font-size: 40px;
  color:red;
}
</style>
