Vue.component('pedigree-ui', {
  template: `
  <div>
    <div class="header">
      <div class="app_title">
        <div>Pedigree Editor</div>
      </div>
      <div id="menu_container" role="menubar"/>
      <div class="pedigree_title">
        <table>
          <tbody>
            <tr>
              <td>Pedigree Title.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="login_status">
        <div><a href="#">Not signed in.</a></div>
      </div>
    </div>
    <div class="toolbar">
      <div style="height: 172px;">
        <pedigree-button buttontype="male" caption="Male" v-on:click="male()"/>
        <pedigree-button buttontype="female" caption="Female" v-on:click="female()"/>
        <pedigree-button buttontype="nogender" caption="No Gender" v-on:click="nogender()"/>
        <pedigree-button buttontype="pregloss" caption="Preg. Loss" v-on:click="pregloss()"/>
      </div>
      <div style="height: 96px;">
        <pedigree-button buttontype="union" caption="Union" v-on:click="union()"/>
        <pedigree-button buttontype="grab" caption="Grab Child" v-on:click="grab()"/>
      </div>
      <div>
        <pedigree-button buttontype="carrier" caption="Carrier" v-on:click="carrier()"/>
        <pedigree-button buttontype="affected" caption="Affected" v-on:click="affected()"/>
        <pedigree-button buttontype="dead" caption="Dead" v-on:click="dead()"/>
        <pedigree-button buttontype="proband" caption="Proband" v-on:click="proband()"/>
        <pedigree-button buttontype="twin" caption="Twin" v-on:click="twin()"/>
        <pedigree-button buttontype="pregnancy" caption="Pregnancy" v-on:click="pregnancy()"/>
      </div>
    </div>
    <div id="pedigree_frame_wrapper"></div>
    <div id="footer" aria-live="polite"></div>
  </div>
  `,
  mounted() {
    this.ui = new pedigree.UI(tu2);
    window.setTimeout(() => {
      this.ui.run();
    }, 0);
  },
  methods: {
    male: function() {
      this.ui.addMale();
    },
    female: function() {
      this.ui.addFemale();
    },
    nogender: function() {
      this.ui.addNogender();
    },
    pregloss: function() {
      this.ui.addPregloss();
    },
    union: function() {
      this.ui.union();
    },
    grab: function() {
      this.ui.grabChild();
    },
    carrier: function() {
      this.ui.toggleCarrier();
    },
    affected: function() {
      this.ui.toggleAffected();
    },
    dead: function() {
      this.ui.toggleDead();
    },
    proband: function() {
      this.ui.toggleProband();
    },
    twin: function() {
      this.ui.toggleTwin();
    },
    pregnancy: function() {
      this.ui.togglePregnancy();
    },
  }
});
