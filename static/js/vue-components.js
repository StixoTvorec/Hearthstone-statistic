(() => {
    if(typeof window.Vue !== undefined) {
        Vue.component('tabs', {
            template: `
<div class="">
<div class="tabs">
    <ul>
        <li v-for="tab in tabs" :class="{ 'is-active': tab.isActive }">
            <a :href="tab.href" @click="selectTab(tab)">{{ tab.name }}</a>
        </li>
    </ul>
</div>
<div class="tab-detailts">
    <slot></slot>
</div>
</div>
`,
            mounted() {
            },
            data() {
                return {tabs: []};
            },
            created() {
                this.tabs = this.$children;
            },
            methods: {
                selectTab(selectedTab) {
                    this.tabs.forEach(tab => {
                        tab.isActive = (tab.name === selectedTab.name)
                    });
                },
            }
        });

        Vue.component('tab', {
            template: '<div v-show="isActive"><slot></slot></div>',
            props: {
                name: {
                    required: true,
                },
                selected: {
                    default: false,
                },
            },
            data() {
                return {
                    isActive: false
                };
            },
            computed: {
                href() {
                    return '#' + this.name.toLowerCase().replace(/ /g, '-');
                }
            },
            mounted() {
                this.isActive = this.selected;
            }
        });
    }
})();