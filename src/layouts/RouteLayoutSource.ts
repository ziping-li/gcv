import {
  VNode,
  Component,
  ConcreteComponent,
  h,
  defineComponent,
  shallowReactive,
} from 'vue'
import { RouteRecordRaw } from 'vue-router'

export function setupLayouts(routes: RouteRecordRaw[]) {
  const RouterLayout = createRouterLayout((layout: string) => {
    return import(`../layouts/${layout}.tsx`)
  })

  return [
    {
      path: '/',
      component: RouterLayout,
      children: routes,
    },
  ]
}

export function createRouterLayout(
  resolve: (layoutName: string) => Promise<Component | { default: Component }>,
) {
  return defineComponent({
    name: 'RouterLayout',

    async beforeRouteEnter(to, _from, next) {
      const name = to.meta.layout || 'default'
      const layoutComp = name
        ? ((await resolve(name)) as any).default
        : undefined

      next((vm: any) => {
        vm.layoutName = name
        if (name && layoutComp)
          vm.layouts[name] = layoutComp
      })
    },

    async beforeRouteUpdate(to, _from, next) {
      try {
        const name = to.meta.layout || 'default'
        if (name && !this.layouts[name])
          this.layouts[name] = ((await resolve(name)) as any).default

        this.layoutName = name
        next()
      }
      catch (error) {
        next(error)
      }
    },

    data() {
      return {
        layoutName: undefined as string | undefined,
        layouts: shallowReactive(
          Object.create(null) as Record<string, Component>,
        ),
      }
    },

    render(): VNode {
      const layout = this.layoutName && this.layouts[this.layoutName]
      if (!layout)
        return h('span')

      return h(layout as ConcreteComponent, {
        key: this.layoutName,
      })
    },
  })
}
