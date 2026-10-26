<script setup lang="ts">
import { BLOOM_CARD_DEFAULTS, BLOOM_CARD_PROPS, BLOOM_CARD_RANGES } from './elementalCards/defaults'
import { bloomEffect } from './elementalCards/bloom'
import { useElementalCard } from './elementalCards/useElementalCard'

const props = defineProps(BLOOM_CARD_PROPS)
const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:playing': [value: boolean]
}>()
const { root, controls } = useElementalCard('bloom', props, BLOOM_CARD_DEFAULTS, BLOOM_CARD_RANGES, bloomEffect, emit)
defineExpose(controls)
</script>

<template>
  <TresGroup>
    <primitive :object="root" :dispose="null" />
  </TresGroup>
</template>
