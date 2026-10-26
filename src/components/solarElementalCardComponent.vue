<script setup lang="ts">
import { SOLAR_CARD_DEFAULTS, SOLAR_CARD_PROPS, SOLAR_CARD_RANGES } from './elementalCards/defaults'
import { solarEffect } from './elementalCards/solar'
import { useElementalCard } from './elementalCards/useElementalCard'

const props = defineProps(SOLAR_CARD_PROPS)
const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:playing': [value: boolean]
}>()
const { root, controls } = useElementalCard('solar', props, SOLAR_CARD_DEFAULTS, SOLAR_CARD_RANGES, solarEffect, emit)
defineExpose(controls)
</script>

<template>
  <TresGroup>
    <primitive :object="root" :dispose="null" />
  </TresGroup>
</template>
