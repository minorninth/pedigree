Vue.component('pedigree-button', {
  props: {
      buttontype: String,
      caption: String,
  },
  template: `
    <button v-on:click="onClick()">
      <div :class="imgClass">
        <div :class="overlayClass"/>
      </div>
      <div :class="img2Class"/>
      <div class="caption"> {{ caption }} </div>
    </button>
  `,
  computed: {
      imgClass: function() {
	  return "img " + this.buttontype;
      },
      overlayClass: function() {
	  return "overlay " + this.buttontype;
      },
      img2Class: function() {
	  return "img2 " + this.buttontype;
      },
  },
  methods: {
    onClick: function() {
      this.$emit('click');
    }
  }
});
