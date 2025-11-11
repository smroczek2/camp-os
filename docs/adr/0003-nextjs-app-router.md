# ADR-0003: Use Next.js App Router

## Status

Accepted

## Context

Next.js offers two routing paradigms:
- **Pages Router**: The traditional routing system (Next.js 12 and earlier)
- **App Router**: The new routing system introduced in Next.js 13

We need to choose which routing paradigm to use for this starter kit.

## Decision

Use **Next.js App Router** for all routing and page organization.

## Consequences

### Positive

- **React Server Components**: Better performance, smaller client bundles
- **Streaming & Suspense**: Built-in support for progressive rendering
- **Layouts**: Shared layouts without prop drilling
- **Modern Patterns**: Aligned with React's future direction
- **Better Data Fetching**: async/await in server components
- **Parallel Routes**: Advanced routing patterns
- **Type Safety**: Better TypeScript integration
- **Future-Proof**: This is the direction Next.js is going

### Negative

- **Learning Curve**: Requires understanding server vs client components
- **Ecosystem Maturity**: Some third-party libraries not yet App Router-ready
- **Mental Model Shift**: Different from traditional React patterns
- **Documentation**: Still evolving, some edge cases not well-documented

### Neutral

- **Migration**: If needed, can gradually migrate pages to App Router
- **Client Components**: Can still use traditional client-side React when needed with "use client"

## Alternatives Considered

- **Pages Router**: More mature, larger ecosystem, but represents old paradigm and won't receive new features
- **Other Frameworks**: Remix, SvelteKit, etc., but would lose Next.js ecosystem and Vercel integration

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- All pages in `src/app/` directory
