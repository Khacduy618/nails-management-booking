import type { HTMLAttributes, DetailedHTMLProps } from 'react'

type PhantomUIProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  loading?: string
  'data-shimmer-ignore'?: string
  'data-shimmer-no-children'?: string
  'data-shimmer-width'?: string
  'data-shimmer-height'?: string
  class?: string
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'phantom-ui': PhantomUIProps
    }
  }
}
