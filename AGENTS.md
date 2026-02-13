use "~~" for root folder and "~" for app folder when importing files
use UFormField instead of UFormGroup
use USeparator instead of UDivider
use UFieldGroup instead of UButtonGroup
use UDropdownMenu instead of UDropdown
dont use UVerticalNavigation
use :items prop insted of :options prop
use color="neutral" insted of color="gray"
always use UI MCP before creating/ modifying any nuxt/ui components

if there an email addres in a translation json file use "{'@'}" insted of "@"
add "w-full" class to any UInput UTextarea USelect etc...

"UTable Columns require an id when using a non-string header"
Use the columns prop as an array of ColumnDef objects with properties like:

accessorKey: The key of the row object to use when extracting the value for the column.
header: The header to display for the column. If a string is passed, it can be used as a default for the column ID. If a function is passed, it will be passed a props object for the header and should return the rendered header value (the exact type depends on the adapter being used).
footer: The footer to display for the column. Works exactly like header, but is displayed under the table.
cell: The cell to display each row for the column. If a function is passed, it will be passed a props object for the cell and should return the rendered cell value (the exact type depends on the adapter being used).
meta: Extra properties for the column.
class:
td: The classes to apply to the td element.
th: The classes to apply to the th element.
style:
td: The style to apply to the td element.
th: The style to apply to the th element.
In order to render components or other HTML elements, you will need to use the Vue h function inside the header and cell props. This is different from other components that use slots but allows for more flexibility.

Modal

A dialog window that can be used to display a message or request user input.
Usage
Use a Button or any other component in the default slot of the Modal.

Then, use the #content slot to add the content displayed when the Modal is open.

Open

<template>
  <UModal>
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #content>
      <Placeholder class="h-48 m-4" />
    </template>

  </UModal>
</template>
You can also use the #header, #body and #footer slots to customize the Modal's content.

Title
Use the title prop to set the title of the Modal's header.

title
Modal with title

Open

<template>
  <UModal title="Modal with title">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

  </UModal>
</template>
Description
Use the description prop to set the description of the Modal's header.

description
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

Open

<template>
  <UModal
    title="Modal with description"
    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  >
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

  </UModal>
</template>
Close
Use the close prop to customize or hide the close button (with false value) displayed in the Modal's header.

You can pass any property from the Button component to customize it.

close.class
rounded-full

Open

<template>
  <UModal
    title="Modal with close button"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full'
    }"
  >
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

  </UModal>
</template>
The close button is not displayed if the #content slot is used as it's a part of the header.
Close Icon
Use the close-icon prop to customize the close button Icon. Defaults to i-lucide-x.

closeIcon
i-lucide-arrow-right

Open

<template>
  <UModal title="Modal with close button" close-icon="i-lucide-arrow-right">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

  </UModal>
</template>
You can customize this icon globally in your vite.config.ts under ui.icons.close key.
Transition
Use the transition prop to control whether the Modal is animated or not. Defaults to true.

transition

false

Open

<template>
  <UModal :transition="false" title="Modal without transition">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

  </UModal>
</template>
Overlay
Use the overlay prop to control whether the Modal has an overlay or not. Defaults to true.

overlay

false

Open

<template>
  <UModal :overlay="false" title="Modal without overlay">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

  </UModal>
</template>
Modal
Use the modal prop to control whether the Modal blocks interaction with outside content. Defaults to true.

When modal is set to false, the overlay is automatically disabled and outside content becomes interactive.
modal

false

Open

<template>
  <UModal :modal="false" title="Modal interactive">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

  </UModal>
</template>
Dismissible
Use the dismissible prop to control whether the Modal is dismissible when clicking outside of it or pressing escape. Defaults to true.

A close:prevent event will be emitted when the user tries to close it.
You can combine modal: false with dismissible: false to make the Modal's background interactive without closing it.
dismissible

false
modal

true

Open

<template>
  <UModal :dismissible="false" title="Modal non-dismissible">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

  </UModal>
</template>
Scrollable 
4.2+
Use the scrollable prop to make the Modal's content scrollable within the overlay.

As the overlay is needed for scrolling, modal: false is not compatible and overlay: false only removes the background.
scrollable

true
overlay

true

Open

<template>
  <UModal scrollable title="Modal scrollable">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-full" />
    </template>

  </UModal>
</template>
There's a known issue where clicking on the scrollbar may unintentionally close the dialog on some operating systems.
Fullscreen
Use the fullscreen prop to make the Modal fullscreen.

Open

<template>
  <UModal fullscreen title="Modal fullscreen">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-full" />
    </template>

  </UModal>
</template>
Examples
Control open state
You can control the open state by using the default-open prop or the v-model:open directive.

Open

<script setup lang="ts">
const open = ref(false)

defineShortcuts({
  o: () => open.value = !open.value
})
</script>

<template>
  <UModal v-model:open="open">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #content>
      <Placeholder class="h-48 m-4" />
    </template>

  </UModal>
</template>
In this example, leveraging defineShortcuts, you can toggle the Modal by pressing O.
This allows you to move the trigger outside of the Modal or remove it entirely.
Programmatic usage
You can use the useOverlay composable to open a Modal programmatically.

Make sure to wrap your app with the App component which uses the OverlayProvider component.
First, create a modal component that will be opened programmatically:

ModalExample.vue

<script setup lang="ts">
defineProps<{
  count: number
}>()

const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal
    :close="{ onClick: () => emit('close', false) }"
    :title="`This modal was opened programmatically ${count} times`"
  >
    <template #footer>
      <div class="flex gap-2">
        <UButton color="neutral" label="Dismiss" @click="emit('close', false)" />
        <UButton label="Success" @click="emit('close', true)" />
      </div>
    </template>
  </UModal>
</template>
We are emitting a close event when the modal is closed or dismissed here. You can emit any data through the close event, however, the event must be emitted in order to capture the return value.
Then, use it in your app:

Open

<script setup lang="ts">
import { LazyModalExample } from '#components'

const count = ref(0)

const toast = useToast()
const overlay = useOverlay()

const modal = overlay.create(LazyModalExample)

async function open() {
  const instance = modal.open({
    count: count.value
  })

  const shouldIncrement = await instance.result

  if (shouldIncrement) {
    count.value++

    toast.add({
      title: `Success: ${shouldIncrement}`,
      color: 'success',
      id: 'modal-success'
    })

    // Update the count
    modal.patch({
      count: count.value
    })
    return
  }

  toast.add({
    title: `Dismissed: ${shouldIncrement}`,
    color: 'error',
    id: 'modal-dismiss'
  })
}
</script>

<template>
  <UButton label="Open" color="neutral" variant="subtle" @click="open" />
</template>
You can close the modal within the modal component by emitting emit('close').
Nested modals
You can nest modals within each other.

Open

<script setup lang="ts">
const first = ref(false)
const second = ref(false)
</script>

<template>
  <UModal v-model:open="first" title="First modal" :ui="{ footer: 'justify-end' }">
    <UButton color="neutral" variant="subtle" label="Open" />

    <template #footer>
      <UButton label="Close" color="neutral" variant="outline" @click="first = false" />

      <UModal v-model:open="second" title="Second modal" :ui="{ footer: 'justify-end' }">
        <UButton label="Open second" color="neutral" />

        <template #footer>
          <UButton label="Close" color="neutral" variant="outline" @click="second = false" />
        </template>
      </UModal>
    </template>

  </UModal>
</template>
With footer slot
Use the #footer slot to add content after the Modal's body.

Open

<script setup lang="ts">
const open = ref(false)
</script>

<template>
  <UModal v-model:open="open" title="Modal with footer" description="This is useful when you want a form in a Modal." :ui="{ footer: 'justify-end' }">
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #body>
      <Placeholder class="h-48" />
    </template>

    <template #footer="{ close }">
      <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
      <UButton label="Submit" color="neutral" />
    </template>

  </UModal>
</template>
With command palette
You can use a CommandPalette component inside the Modal's content.

Search users...

<script setup lang="ts">
const searchTerm = ref('')

const { data: users, status } = await useFetch('https://jsonplaceholder.typicode.com/users', {
  key: 'command-palette-users',
  params: { q: searchTerm },
  transform: (data: { id: number, name: string, email: string }[]) => {
    return data?.map(user => ({ id: user.id, label: user.name, suffix: user.email, avatar: { src: `https://i.pravatar.cc/120?img=${user.id}` } })) || []
  },
  lazy: true
})

const groups = computed(() => [{
  id: 'users',
  label: searchTerm.value ? `Users matching “${searchTerm.value}”...` : 'Users',
  items: users.value || [],
  ignoreFilter: true
}])
</script>

<template>
  <UModal>
    <UButton
      label="Search users..."
      color="neutral"
      variant="subtle"
      icon="i-lucide-search"
    />

    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :loading="status === 'pending'"
        :groups="groups"
        placeholder="Search users..."
        class="h-80"
      />
    </template>

  </UModal>
</template>

Expand code
API
Props
Prop Default Type
title
string

description
string

content
DialogContentProps & Partial<EmitsToProps<DialogContentImplEmits>>

The content of the modal.

Show properties
overlay
true

boolean

Render an overlay behind the modal.

scrollable
false

boolean

When true, enables scrollable overlay mode where content scrolls within the overlay.

transition
true

boolean

Animate the modal when opening or closing.

fullscreen
false

boolean

When true, the modal will take up the full screen.

portal
true

string | false | true | HTMLElement

Render the modal in a portal.

Show properties
close
true

boolean | Omit<ButtonProps, LinkPropsKeys>

Display a close button to dismiss the modal. { size: 'md', color: 'neutral', variant: 'ghost' }

closeIcon
appConfig.ui.icons.close

any

The icon displayed in the close button.

dismissible
true

boolean

When false, the modal will not close when clicking outside or pressing escape.

open
boolean

The controlled open state of the dialog. Can be binded as v-model:open.

defaultOpen
boolean

The open state of the dialog when it is initially rendered. Use when you do not need to control its open state.

modal
true

boolean

The modality of the dialog When set to true,
interaction with outside elements will be disabled and only dialog content will be visible to screen readers.

ui
{ overlay?: ClassNameValue; content?: ClassNameValue; header?: ClassNameValue; wrapper?: ClassNameValue; body?: ClassNameValue; footer?: ClassNameValue; title?: ClassNameValue; description?: ClassNameValue; close?: ClassNameValue; }

Slots
Slot Type
default
{ open: boolean; }

content
{ close: () => void; }

header
{ close: () => void; }

title
{}

description
{}

actions
{}

close
{ ui: object; }

body
{ close: () => void; }

footer
{ close: () => void; }

Emits
Event Type
after:leave
[]

after:enter
[]

close:prevent
[]

update:open
[value: boolean]

Theme
vite.config.ts

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
plugins: [
vue(),
ui({
ui: {
modal: {
slots: {
overlay: 'fixed inset-0',
content: 'bg-default divide-y divide-default flex flex-col focus:outline-none',
header: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-16',
wrapper: '',
body: 'flex-1 p-4 sm:p-6',
footer: 'flex items-center gap-1.5 p-4 sm:px-6',
title: 'text-highlighted font-semibold',
description: 'mt-1 text-muted text-sm',
close: 'absolute top-4 end-4'
},
variants: {
transition: {
true: {
overlay: 'data-[state=open]:animate-[fade-in_200ms_ease-out] data-[state=closed]:animate-[fade-out_200ms_ease-in]',
content: 'data-[state=open]:animate-[scale-in_200ms_ease-out] data-[state=closed]:animate-[scale-out_200ms_ease-in]'
}
},
fullscreen: {
true: {
content: 'inset-0'
},
false: {
content: 'w-[calc(100vw-2rem)] max-w-lg rounded-lg shadow-lg ring ring-default'
}
},
overlay: {
true: {
overlay: 'bg-elevated/75'
}
},
scrollable: {
true: {
overlay: 'overflow-y-auto',
content: 'relative'
},
false: {
content: 'fixed',
body: 'overflow-y-auto'
}
}
},
compoundVariants: [
{
scrollable: true,
fullscreen: false,
class: {
overlay: 'grid place-items-center p-4 sm:py-8'
}
},
{
scrollable: false,
fullscreen: false,
class: {
content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden'
}
}
]
}
}
})
]
})
