import { defineBlueprint, defineDocumentFunction } from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineDocumentFunction({ name: 'log-event', event: { on: ['create', 'update'] } }),
  ],
})
