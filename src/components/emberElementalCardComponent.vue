<script setup lang="ts">
import { EMBER_CARD_DEFAULTS, EMBER_CARD_PROPS, EMBER_CARD_RANGES } from './elementalCards/defaults'
import { emberEffect } from './elementalCards/ember'
import { useElementalCard } from './elementalCards/useElementalCard'

const props = defineProps(EMBER_CARD_PROPS)
const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:playing': [value: boolean]
}>()
const { root, controls } = useElementalCard('ember', props, EMBER_CARD_DEFAULTS, EMBER_CARD_RANGES, emberEffect, emit)
defineExpose(controls)
</script>

<template>
  <TresGroup>
    <primitive :object="root" :dispose="null" />
  </TresGroup>
</template>
