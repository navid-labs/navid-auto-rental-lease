import { describe, it, expect, beforeAll } from 'vitest'
import { render } from '@testing-library/react'

// Polyfill getAnimations for happy-dom (used by base-ui ScrollArea viewport)
beforeAll(() => {
  if (!Element.prototype.getAnimations) {
    Element.prototype.getAnimations = () => []
  }
})

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

describe('COMP-02: shadcn component renders', () => {
  it('Accordion renders without error', () => {
    expect(() =>
      render(
        <Accordion>
          <AccordionItem value="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    ).not.toThrow()
  })

  it('Tabs renders without error', () => {
    expect(() =>
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
    ).not.toThrow()
  })

  it('Carousel renders without error', () => {
    expect(() =>
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
    ).not.toThrow()
  })

  it('Collapsible renders without error', () => {
    expect(() =>
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
    ).not.toThrow()
  })

  it('Progress renders without error', () => {
    expect(() => render(<Progress value={50} />)).not.toThrow()
  })

  it('Pagination renders without error', () => {
    expect(() =>
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )
    ).not.toThrow()
  })

  it('Popover renders without error', () => {
    expect(() =>
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )
    ).not.toThrow()
  })

  it('ScrollArea renders without error', () => {
    expect(() =>
      render(
        <ScrollArea className="h-48 w-48">
          <div>Scrollable content</div>
        </ScrollArea>
      )
    ).not.toThrow()
  })

  it('Avatar renders without error', () => {
    expect(() =>
      render(
        <Avatar>
          <AvatarImage src="" alt="test" />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      )
    ).not.toThrow()
  })

  it('Breadcrumb renders without error', () => {
    expect(() =>
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
    ).not.toThrow()
  })

  it('ToggleGroup renders without error', () => {
    expect(() =>
      render(
        <ToggleGroup>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      )
    ).not.toThrow()
  })

  it('RadioGroup renders without error', () => {
    expect(() =>
      render(
        <RadioGroup>
          <RadioGroupItem value="a" />
          <RadioGroupItem value="b" />
        </RadioGroup>
      )
    ).not.toThrow()
  })

  it('DropdownMenu renders without error', () => {
    expect(() =>
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    ).not.toThrow()
  })
})
