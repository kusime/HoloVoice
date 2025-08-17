<template>
  <div data-theme="dark" class="min-h-screen bg-base-100">
    <BrandNavbar />
    <main class="container mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
<script setup lang="ts"></script>
