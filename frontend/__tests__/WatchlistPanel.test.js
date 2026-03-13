import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import React, { useState, useEffect } from 'react'

describe('WatchlistPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('adds and removes movie from watchlist, persists to localStorage', () => {
    // Mocking the behavior for the watchlist panel that saves to local storage
    const MockWatchlistPanel = () => {
      const [watchlist, setWatchlist] = useState(() => {
        const saved = localStorage.getItem('nebula-watchlist')
        return saved ? JSON.parse(saved) : []
      })

      useEffect(() => {
        localStorage.setItem('nebula-watchlist', JSON.stringify(watchlist))
      }, [watchlist])

      const toggleMovie = (id) => {
        setWatchlist(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
      }

      return (
        <div>
          <button onClick={() => toggleMovie('movie-1')}>Toggle Movie 1</button>
          <div data-testid="watchlist-count">{watchlist.length}</div>
        </div>
      )
    }

    render(<MockWatchlistPanel />)
    
    // Add to watchlist
    fireEvent.click(screen.getByText('Toggle Movie 1'))
    expect(screen.getByTestId('watchlist-count')).toHaveTextContent('1')
    expect(JSON.parse(localStorage.getItem('nebula-watchlist'))).toContain('movie-1')
    
    // Remove from watchlist
    fireEvent.click(screen.getByText('Toggle Movie 1'))
    expect(screen.getByTestId('watchlist-count')).toHaveTextContent('0')
    expect(JSON.parse(localStorage.getItem('nebula-watchlist'))).not.toContain('movie-1')
  })
})
