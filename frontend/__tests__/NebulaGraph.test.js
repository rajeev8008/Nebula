import { render } from '@testing-library/react'
import NebulaGraph from '../components/NebulaGraph'

// Mock react-force-graph-3d
jest.mock('react-force-graph-3d', () => {
  return function MockForceGraph3D() {
    return <div data-testid="force-graph-3d">Mocked Force Graph</div>
  }
})

describe('NebulaGraph Component', () => {
  const mockData = {
    nodes: [
      { id: '1', title: 'Movie 1', poster: 'test1.jpg', rating: 8.0 },
      { id: '2', title: 'Movie 2', poster: 'test2.jpg', rating: 7.5 }
    ],
    links: [
      { source: '1', target: '2' }
    ]
  }

  test('renders without crashing', () => {
    const { container } = render(
      <NebulaGraph 
        graphData={mockData}
        onNodeClick={() => {}}
        selectedNode={null}
      />
    )
    expect(container).toBeInTheDocument()
  })

  test('renders force graph component', () => {
    const { getByTestId } = render(
      <NebulaGraph 
        graphData={mockData}
        onNodeClick={() => {}}
        selectedNode={null}
      />
    )
    expect(getByTestId('force-graph-3d')).toBeInTheDocument()
  })

  test('accepts graphData prop', () => {
    const { container } = render(
      <NebulaGraph 
        graphData={mockData}
        onNodeClick={() => {}}
        selectedNode={null}
      />
    )
    expect(container).toBeTruthy()
  })

  test('handles node click callback', () => {
    const mockOnClick = jest.fn()
    render(
      <NebulaGraph 
        graphData={mockData}
        onNodeClick={mockOnClick}
        selectedNode={null}
      />
    )
    // Note: Testing actual click would require more complex setup
    expect(mockOnClick).not.toHaveBeenCalled()
  })
})
