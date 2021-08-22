<template>
  <div
    class="
      w-14
      h-8
      flex
      items-center
      bg-gray-300
      rounded-full
      p-1
      duration-300
      cursor-pointer
    "
    :class="{ 'bg-green-400': modelValue }"
    :aria-checked="modelValue.toString()"
    @click="toggle"
  >
    <div
      class="bg-white w-6 h-6 rounded-full shadow-md transform duration-300"
      :class="{ 'translate-x-6': modelValue }"
    ></div>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  export default defineComponent({
    props: {
      modelValue: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['update:modelValue'],
    setup(props, context) {
      const toggle = () => {
        context.emit('update:modelValue', !props.modelValue)
      }
      return { toggle }
    },
  })
</script>
