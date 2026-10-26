<script setup lang="ts">
import { BREEZE_CARD_DEFAULTS, BREEZE_CARD_PROPS, BREEZE_CARD_RANGES } from './elementalCards/defaults'
import { breezeEffect } from './elementalCards/breeze'
import { useElementalCard } from './elementalCards/useElementalCard'

const props = defineProps(BREEZE_CARD_PROPS)
const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:playing': [value: boolean]
}>()
const { root, controls } = useElementalCard('breeze', props, BREEZE_CARD_DEFAULTS, BREEZE_CARD_RANGES, breezeEffect, emit)
defineExpose(controls)
</script>

<template>
  <TresGroup>
    <primitive :object="root" :dispose="null" />
  </TresGroup>
</template>
