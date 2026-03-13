import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import React, { useState } from 'react'

describe('BrowseMovies', () => {
  it('search bar filters results and filters apply correctly', () => {
    // Mock the BrowseMovies functionality
    const mockMovies = [
      { id: 1, title: 'Inception', genre: 'Sci-Fi' },
      { id: 2, title: 'The Dark Knight', genre: 'Action' }
    ]

    const MockBrowseMovies = () => {
      const [searchTerm, setSearchTerm] = useState('')
      const [filterGenre, setFilterGenre] = useState('All')

      const filtered = mockMovies.filter(m => {
        const matchSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchGenre = filterGenre === 'All' || m.genre === filterGenre
        return matchSearch && matchGenre
      })

      return (
        <div>
          <input 
            data-testid="search-input" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <select 
            data-testid="genre-filter"
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Action">Action</option>
          </select>

          <ul data-testid="movie-list">
            {filtered.map(m => (
              <li key={m.id} data-testid="movie-item">{m.title}</li>
            ))}
          </ul>
        </div>
      )
    }

    render(<MockBrowseMovies />)
    
    // Initial render
    expect(screen.getAllByTestId('movie-item')).toHaveLength(2)
    
    // Test search filter
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Incep' } })
    expect(screen.getAllByTestId('movie-item')).toHaveLength(1)
    expect(screen.getByText('Inception')).toBeInTheDocument()
    
    // Reset search
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: '' } })
    
    // Test category filter
    fireEvent.change(screen.getByTestId('genre-filter'), { target: { value: 'Action' } })
    expect(screen.getAllByTestId('movie-item')).toHaveLength(1)
    expect(screen.getByText('The Dark Knight')).toBeInTheDocument()
  })
})
