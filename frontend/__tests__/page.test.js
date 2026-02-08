import { render, screen } from '@testing-library/react'
import Page from '@/app/page'

// Mock animated-shader-hero before importing
jest.mock('@/components/ui/animated-shader-hero', () => {
  return function MockHero() {
    return <div data-testid="hero-component">Hero</div>
  }
})

//Mock NebulaGraph component
jest.mock('@/components/NebulaGraph', () => {
  return function MockNebulaGraph() {
    return <div data-testid="nebula-graph">Graph</div>
  }
})

// Mock fetch globally
global.fetch = jest.fn()

beforeEach(() => {
  fetch.mockClear()
})

describe('Page Component', () => {
  test('renders without crashing', () => {
    render(<Page />)
    expect(screen.getByTestId('hero-component')).toBeInTheDocument()
  })

  test('renders hero component', () => {
    render(<Page />)
    const hero = screen.getByTestId('hero-component')
    expect(hero).toBeInTheDocument()
  })

  test('component mounts successfully', () => {
    const { container } = render(<Page />)
    expect(container.firstChild).toBeTruthy()
  })

  test('hero component displays', () => {
    render(<Page />)
    expect(screen.getByText('Hero')).toBeInTheDocument()
  })
})
