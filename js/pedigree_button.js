Vue.component("pedigree-button", {
    props: {
        buttontype: String,
        caption: String,
        shortcut: String,
    },
    template: `
    <button v-on:click="onClick()" :title="titleStr">
      <div class="shortcutwrap">
        <div class="shortcut"> {{ titleStr }} </div>
      </div>
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
        titleStr: function() {
            return this.shortcut ? this.shortcut : "";
        }
    },
    methods: {
        onClick: function() {
            this.$emit("click");
        },
    },
});