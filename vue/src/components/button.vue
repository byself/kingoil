<template>
  <div
    class="mm-button"
    :class="type"
    v-on="$listeners"
  >
    <slot></slot>
  </div>
</template>
<script>
export default {
  name: "mm-button",
  props: {
    type: {
      type: String,
      default: "primary"
    }
  }
};
</script>
<style lang="scss">
.mm-button {
  width: 100%;
  height: 80px;
  line-height: 80px;
  text-align: center;
  border-radius: 6px;
  font-size: 28px;

  &.primary {
    color: #fff;
    background-color: #ff5257;
  }

  &.minor {
    color: #333;
    background-color: #ddd;
  }

  &:active {
    opacity: 0.5;
  }
}
</style>