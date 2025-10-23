// Minimal type declarations for Next.js modules missing in this environment.
// These provide basic 'any' fallbacks so TypeScript stops reporting missing
// declaration files while real types from Next are available in node_modules.

declare module 'next/image' {
  import * as React from 'react'
  const Image: React.ComponentType<any>
  export default Image
}

declare module 'next/link' {
  import * as React from 'react'
  const Link: React.ComponentType<any>
  export default Link
}

declare module 'next/dynamic' {
  export default function dynamic(...args: any[]): any
}

declare module 'next/navigation' {
  export function useRouter(...args: any[]): any
  export function useSearchParams(...args: any[]): any
  export function usePathname(...args: any[]): any
  export function useParams(...args: any[]): any
}

// Fallback for other next package sub-modules that may not have declarations.
declare module 'next/*' {
  const whatever: any
  export default whatever
}
