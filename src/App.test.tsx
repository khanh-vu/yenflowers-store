import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HomePage from './pages/public/HomePage'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    Toaster: () => null,
    default: { success: vi.fn(), error: vi.fn() },
}))

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
})

const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                {ui}
            </MemoryRouter>
        </QueryClientProvider>
    )
}

describe('HomePage Component', () => {
    it('renders hero section with main title', () => {
        renderWithProviders(<HomePage />)
        expect(screen.getAllByText(/Gửi Trao/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/Yêu Thương/i).length).toBeGreaterThan(0)
    })

    it('renders category section', () => {
        renderWithProviders(<HomePage />)
        expect(screen.getByText('Danh Mục Hoa')).toBeInTheDocument()
        expect(screen.getByText('Sinh Nhật')).toBeInTheDocument()
    })

    it('renders features section', () => {
        renderWithProviders(<HomePage />)
        expect(screen.getByText('Hoa Tươi Mỗi Ngày')).toBeInTheDocument()
        expect(screen.getByText('Giao Hàng Siêu Tốc')).toBeInTheDocument()
    })

    it('renders product showcase', () => {
        renderWithProviders(<HomePage />)
        expect(screen.getByText('Sản Phẩm Nổi Bật')).toBeInTheDocument()
        expect(screen.getByText('Mới Nhất')).toBeInTheDocument()
    })

    it('renders story section', () => {
        renderWithProviders(<HomePage />)
        expect(screen.getAllByText(/Về Chúng Tôi/i).length).toBeGreaterThan(0)
    })

    it('renders instagram feed section', () => {
        renderWithProviders(<HomePage />)
        expect(screen.getByText('Theo Dõi Trên Instagram')).toBeInTheDocument()
    })
})

describe('Accessibility', () => {
    it('buttons are keyboard accessible', () => {
        renderWithProviders(<HomePage />)
        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
            expect(button).not.toHaveAttribute('tabindex', '-1')
        })
    })

    it('images have alt text', () => {
        renderWithProviders(<HomePage />)
        const images = screen.getAllByRole('img')
        images.forEach(img => {
            expect(img).toHaveAttribute('alt')
        })
    })
})
