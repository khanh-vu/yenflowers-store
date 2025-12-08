import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import StoreFront from '@/StoreFront'

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

describe('Storefront Component', () => {
    it('renders the header with logo', () => {
        renderWithProviders(<StoreFront />)
        expect(screen.getAllByText(/YenFlowers/i).length).toBeGreaterThan(0)
    })

    it('renders navigation links', () => {
        renderWithProviders(<StoreFront />)
        expect(screen.getByText('Sản Phẩm')).toBeInTheDocument()
        expect(screen.getByText('Dịch Vụ')).toBeInTheDocument()
        expect(screen.getByText('Blog')).toBeInTheDocument()
        expect(screen.getAllByText('Liên Hệ').length).toBeGreaterThan(0)
    })

    it('renders hero section with CTA', () => {
        renderWithProviders(<StoreFront />)
        expect(screen.getByText('Hoa Tươi Cao Cấp')).toBeInTheDocument()
        expect(screen.getByText('Xem Bộ Sưu Tập')).toBeInTheDocument()
    })

    it('renders category section', () => {
        renderWithProviders(<StoreFront />)
        expect(screen.getByText('Danh Mục')).toBeInTheDocument()
        expect(screen.getByText('Sinh Nhật')).toBeInTheDocument()
        expect(screen.getByText('Tình Yêu')).toBeInTheDocument()
    })

    it('renders featured products section', () => {
        renderWithProviders(<StoreFront />)
        expect(screen.getByText('Sản Phẩm Nổi Bật')).toBeInTheDocument()
    })

    it('renders product names', () => {
        renderWithProviders(<StoreFront />)
        expect(screen.getByText('Hoa Hồng Đỏ')).toBeInTheDocument()
    })

    it('renders footer with social links', () => {
        renderWithProviders(<StoreFront />)
        expect(screen.getByText('Facebook')).toBeInTheDocument()
        expect(screen.getByText('Instagram')).toBeInTheDocument()
    })

    it('cart badge shows zero initially', () => {
        renderWithProviders(<StoreFront />)
        expect(screen.getByText('0')).toBeInTheDocument()
    })
})

describe('Accessibility', () => {
    it('buttons are keyboard accessible', () => {
        renderWithProviders(<StoreFront />)
        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
            expect(button).not.toHaveAttribute('tabindex', '-1')
        })
    })

    it('images have alt text', () => {
        renderWithProviders(<StoreFront />)
        const images = screen.getAllByRole('img')
        images.forEach(img => {
            expect(img).toHaveAttribute('alt')
        })
    })

    it('links are properly labeled', () => {
        renderWithProviders(<StoreFront />)
        const links = screen.getAllByRole('link')
        links.forEach(link => {
            expect(link.textContent || link.getAttribute('aria-label')).toBeTruthy()
        })
    })
})

describe('Responsive Design', () => {
    it('renders mobile menu button', () => {
        renderWithProviders(<StoreFront />)
        // Mobile menu button exists in the DOM
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
    })
})
