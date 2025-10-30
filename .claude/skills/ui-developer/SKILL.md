---
name: ui-developer
description: Use when creating, modifying, or reviewing React components and UI elements. Ensures responsive designs, consistent styling patterns, proper component reusability, and adherence to the design system. Guides all frontend visual work using Next.js, shadcn/ui, and Tailwind CSS.
---

# UI Developer

This skill guides you in building polished, consistent, and reusable UI components that integrate seamlessly with the starter kit's design system.

## When to Use This Skill

**Activate when:**
- Creating new React components or UI elements
- Modifying existing component styling or layout
- Implementing responsive designs
- Refactoring components for better reusability
- Building forms, modals, cards, or any visual elements
- Working on page layouts and navigation
- Ensuring design consistency across the application

**Even for small UI changes**, this skill helps maintain consistency and quality standards.

## Core Principles

### 1. Use shadcn/ui Components First

**Always check shadcn/ui before building custom components:**

```bash
# Search available components
pnpm dlx shadcn@latest add --help

# Common components to use:
- button, card, input, textarea, select
- form (with react-hook-form integration)
- dialog, sheet, popover, dropdown-menu
- tabs, accordion, collapsible
- badge, avatar, separator
- toast, alert, alert-dialog
- table, data-table
- calendar, date-picker
- checkbox, radio-group, switch
```

**Why?** shadcn/ui provides:
- Consistent styling with the design system
- Accessibility built-in
- Dark mode support via CSS variables
- Full TypeScript support
- Customizable but standardized

### 2. Styling Standards

#### Use Tailwind CSS Only
- **Never write custom CSS** unless absolutely necessary
- Use Tailwind utility classes for all styling
- Leverage CSS variables from `globals.css` for theming

#### Standard Color Palette
```typescript
// Text colors
text-foreground          // Primary text
text-muted-foreground    // Secondary text
text-destructive         // Error/danger text

// Background colors
bg-background           // Main background
bg-card                 // Card backgrounds
bg-muted                // Muted backgrounds
bg-primary              // Primary actions
bg-destructive          // Destructive actions

// Borders
border-border           // Standard borders
border-input            // Input borders
```

**Never use custom colors** unless explicitly required. Stick to the design system.

#### Spacing & Layout
```typescript
// Consistent spacing scale
gap-2, gap-4, gap-6, gap-8     // For flex/grid gaps
space-y-4, space-x-4           // For stacked elements
p-4, px-6, py-8                // Padding
m-4, mx-auto                   // Margins

// Responsive patterns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="flex flex-col md:flex-row"
className="hidden md:block"
```

### 3. Component Structure

#### Server vs Client Components

**Default to Server Components:**
```typescript
// app/features/page.tsx
import { FeatureList } from "@/components/features/feature-list";

export default async function FeaturesPage() {
  // Can fetch data directly
  const data = await fetchData();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Features</h1>
      <FeatureList data={data} />
    </main>
  );
}
```

**Use Client Components when needed:**
```typescript
"use client";

// Only use "use client" when you need:
// - useState, useEffect, or other React hooks
// - Event handlers (onClick, onChange, etc.)
// - Browser APIs
// - Third-party libraries that require client-side

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InteractiveComponent() {
  const [count, setCount] = useState(0);

  return (
    <Button onClick={() => setCount(count + 1)}>
      Count: {count}
    </Button>
  );
}
```

#### Component Organization

```
components/
├── ui/                    # shadcn/ui components (auto-generated)
├── [feature]/             # Feature-specific components
│   ├── feature-list.tsx
│   ├── feature-item.tsx
│   └── feature-form.tsx
└── layout/                # Layout components
    ├── site-header.tsx
    └── site-footer.tsx
```

**Naming conventions:**
- Use kebab-case for filenames: `task-list.tsx`
- Use PascalCase for components: `TaskList`
- Co-locate related components in feature folders

### 4. Responsive Design

#### Mobile-First Approach

```typescript
// Start with mobile, enhance for larger screens
<div className="
  flex flex-col              // Mobile: stack vertically
  md:flex-row                // Tablet+: horizontal layout
  gap-4                      // Consistent spacing
  p-4 md:p-6 lg:p-8          // Responsive padding
">
  <div className="
    w-full                   // Mobile: full width
    md:w-1/2                 // Tablet+: half width
    lg:w-1/3                 // Desktop: third width
  ">
    Content
  </div>
</div>
```

#### Breakpoint Strategy

```typescript
// Tailwind breakpoints (mobile-first)
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large screens

// Common patterns
className="text-sm md:text-base lg:text-lg"           // Responsive text
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" // Responsive grid
className="hidden md:block"                            // Show/hide by size
```

### 5. Component Reusability

#### Build Composable Components

**Bad - Rigid component:**
```typescript
export function UserCard({ user }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{user.email}</p>
        <Button>View Profile</Button>
      </CardContent>
    </Card>
  );
}
```

**Good - Composable component:**
```typescript
export function UserCard({
  user,
  actions,
  showEmail = true,
  className
}: {
  user: User;
  actions?: React.ReactNode;
  showEmail?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {showEmail && <p className="text-muted-foreground">{user.email}</p>}
        {actions}
      </CardContent>
    </Card>
  );
}

// Usage - flexible
<UserCard user={user} actions={<Button>Edit</Button>} />
<UserCard user={user} showEmail={false} />
```

#### Accept className Props

**Always allow className customization:**
```typescript
import { cn } from "@/lib/utils";

export function CustomButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md bg-primary text-primary-foreground",
        className  // Allow overrides
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 6. Form Patterns

#### Use shadcn/ui Form Component

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export function TaskForm({ onSubmit }: { onSubmit: (data: z.infer<typeof formSchema>) => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Optional description" {...field} />
              </FormControl>
              <FormDescription>
                Provide additional details about the task
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Task</Button>
      </form>
    </Form>
  );
}
```

**Form best practices:**
- Use Zod for validation
- Show validation errors inline with `FormMessage`
- Disable submit button during submission
- Show loading states
- Provide helpful descriptions with `FormDescription`

### 7. Loading & Error States

#### Loading States

```typescript
"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Usage
export function TaskList() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  if (loading) return <TaskListSkeleton />;

  return (
    <div className="space-y-4">
      {tasks.map(task => <TaskItem key={task.id} task={task} />)}
    </div>
  );
}
```

#### Error States

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
```

#### Empty States

```typescript
export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 mb-4">{description}</p>
      {action}
    </div>
  );
}

// Usage
<EmptyState
  title="No tasks yet"
  description="Create your first task to get started"
  action={<Button>Create Task</Button>}
/>
```

### 8. Accessibility

#### Essential Patterns

```typescript
// Buttons
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Images
<img src={url} alt="Descriptive text" />

// Forms
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Interactive elements
<button disabled={loading} aria-busy={loading}>
  {loading ? "Loading..." : "Submit"}
</button>

// Semantic HTML
<main>
  <article>
    <header>
      <h1>Title</h1>
    </header>
  </article>
</main>
```

**shadcn/ui components have accessibility built-in** - prefer them over custom implementations.

### 9. Icons

#### Use Lucide React

```typescript
import { Check, X, Plus, Trash2, Edit, ChevronRight } from "lucide-react";

<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Task
</Button>

// Standard icon sizes
h-4 w-4   // 16px - inline with text, buttons
h-5 w-5   // 20px - larger buttons
h-6 w-6   // 24px - headers, prominent actions
h-8 w-8   // 32px - large interactive elements
```

### 10. Common UI Patterns

#### Card List

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function ItemList({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Content */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

#### Modal/Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

#### Dropdown Menu

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Data Table

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map(user => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">Edit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 11. Performance Considerations

#### Optimize Images

```typescript
import Image from "next/image";

// Use Next.js Image component
<Image
  src={imageUrl}
  alt="Description"
  width={500}
  height={300}
  className="rounded-lg"
/>
```

#### Lazy Load Components

```typescript
import dynamic from "next/dynamic";

// Lazy load heavy components
const HeavyComponent = dynamic(() => import("@/components/heavy-component"), {
  loading: () => <Skeleton className="h-32 w-full" />,
});
```

#### Memoization

```typescript
import { memo } from "react";

// Memoize expensive components
export const ExpensiveItem = memo(function ExpensiveItem({ item }: { item: Item }) {
  return (
    <Card>
      {/* Complex rendering */}
    </Card>
  );
});
```

## Anti-Patterns (What NOT to Do)

❌ **Don't create custom components when shadcn/ui has one:**
```typescript
// Bad - custom button
<div className="..." onClick={...}>Click me</div>

// Good - use shadcn Button
<Button onClick={...}>Click me</Button>
```

❌ **Don't use custom colors:**
```typescript
// Bad
<div className="text-[#FF5733] bg-[#123456]">

// Good
<div className="text-foreground bg-background">
```

❌ **Don't write inline styles:**
```typescript
// Bad
<div style={{ padding: "16px", color: "red" }}>

// Good
<div className="p-4 text-destructive">
```

❌ **Don't make everything a client component:**
```typescript
// Bad - unnecessary "use client"
"use client";
export function StaticContent() {
  return <div>Static content</div>;
}

// Good - server component by default
export function StaticContent() {
  return <div>Static content</div>;
}
```

❌ **Don't skip responsive design:**
```typescript
// Bad - fixed widths
<div className="w-[800px]">

// Good - responsive widths
<div className="w-full max-w-4xl mx-auto">
```

❌ **Don't nest too deeply:**
```typescript
// Bad - 6+ levels deep
<div><div><div><div><div><div>Content</div></div></div></div></div></div>

// Good - flatten structure, extract components
<Container>
  <Header />
  <Content />
  <Footer />
</Container>
```

## Quick Reference

### Common Component Installations

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add toast
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add skeleton
```

### Utility Class Reference

```typescript
// Layout
flex, grid, block, inline-block, hidden
flex-col, flex-row, items-center, justify-between
gap-4, space-y-4, space-x-4

// Sizing
w-full, w-1/2, w-auto, max-w-4xl
h-full, h-screen, min-h-screen

// Spacing
p-4, px-6, py-8, m-4, mx-auto, my-8

// Typography
text-sm, text-base, text-lg, text-xl, text-2xl
font-normal, font-medium, font-semibold, font-bold
text-foreground, text-muted-foreground

// Colors (semantic)
bg-background, bg-card, bg-primary, bg-destructive
text-foreground, text-primary, text-destructive
border-border, border-input

// Borders & Radius
border, border-2, border-t, border-b
rounded, rounded-md, rounded-lg, rounded-full

// Shadows
shadow-sm, shadow, shadow-md, shadow-lg
```

## Remember

- **shadcn/ui first** - Use existing components before building custom
- **Tailwind only** - No custom CSS unless absolutely necessary
- **Design system colors** - Never use arbitrary color values
- **Mobile-first** - Start mobile, enhance for larger screens
- **Server by default** - Only use client components when needed
- **Compose, don't repeat** - Build reusable, flexible components
- **Loading states matter** - Show skeletons and loading indicators
- **Accessibility is required** - Use semantic HTML and ARIA labels
- **Type safety** - Full TypeScript for all components

Building great UI is about consistency, reusability, and attention to detail. Follow these patterns and your components will integrate seamlessly with the design system.
