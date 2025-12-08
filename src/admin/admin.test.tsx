import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Admin Components
import { AdminLayout } from '@/admin/components'
import { DashboardPage, ProductsPage, CategoriesPage, OrdersPage, BlogPage, SocialFeedPage, SettingsPage } from '@/admin/pages'

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
})

const renderAdminPage = (page: React.ReactElement, path = '/admin') => {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={page} />
                        <Route path="*" element={page} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    )
}

describe('Admin Dashboard', () => {
    it('renders dashboard title', async () => {
        renderAdminPage(<DashboardPage />)
        await waitFor(() => {
            expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
        })
    })

    it('renders quick actions', async () => {
        renderAdminPage(<DashboardPage />)
        await waitFor(() => {
            expect(screen.getByText('Thao tác nhanh')).toBeInTheDocument()
        })
    })

    it('renders recent orders section', async () => {
        renderAdminPage(<DashboardPage />)
        await waitFor(() => {
            expect(screen.getByText('Đơn hàng gần đây')).toBeInTheDocument()
        })
    })
})

describe('Admin Products Page', () => {
    it('renders products page title', async () => {
        renderAdminPage(<ProductsPage />, '/admin/products')
        await waitFor(() => {
            expect(screen.getByText('Quản lý sản phẩm')).toBeInTheDocument()
        })
    })

    it('renders add product button', async () => {
        renderAdminPage(<ProductsPage />, '/admin/products')
        await waitFor(() => {
            expect(screen.getByText('Thêm sản phẩm')).toBeInTheDocument()
        })
    })

    it('renders search input', async () => {
        renderAdminPage(<ProductsPage />, '/admin/products')
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Tìm kiếm...')).toBeInTheDocument()
        })
    })
})

describe('Admin Categories Page', () => {
    it('renders categories page title', async () => {
        renderAdminPage(<CategoriesPage />, '/admin/categories')
        await waitFor(() => {
            expect(screen.getByText('Quản lý danh mục')).toBeInTheDocument()
        })
    })

    it('renders add category button', async () => {
        renderAdminPage(<CategoriesPage />, '/admin/categories')
        await waitFor(() => {
            expect(screen.getByText('Thêm danh mục')).toBeInTheDocument()
        })
    })
})

describe('Admin Orders Page', () => {
    it('renders orders page title', async () => {
        renderAdminPage(<OrdersPage />, '/admin/orders')
        await waitFor(() => {
            expect(screen.getByText('Quản lý đơn hàng')).toBeInTheDocument()
        })
    })

    it('renders status filter tabs', async () => {
        renderAdminPage(<OrdersPage />, '/admin/orders')
        await waitFor(() => {
            expect(screen.getByText(/Chờ xử lý/)).toBeInTheDocument()
        })
    })
})

describe('Admin Blog Page', () => {
    it('renders blog page title', async () => {
        renderAdminPage(<BlogPage />, '/admin/blog')
        await waitFor(() => {
            expect(screen.getByText('Quản lý Blog')).toBeInTheDocument()
        })
    })

    it('renders new post button', async () => {
        renderAdminPage(<BlogPage />, '/admin/blog')
        await waitFor(() => {
            expect(screen.getByText('Viết bài mới')).toBeInTheDocument()
        })
    })
})

describe('Admin Social Feed Page', () => {
    it('renders social feed title', async () => {
        renderAdminPage(<SocialFeedPage />, '/admin/social')
        await waitFor(() => {
            expect(screen.getAllByText('Social Feed').length).toBeGreaterThan(0)
        })
    })

    it('renders sync button', async () => {
        renderAdminPage(<SocialFeedPage />, '/admin/social')
        await waitFor(() => {
            expect(screen.getByText('Sync Facebook')).toBeInTheDocument()
        })
    })
})

describe('Admin Settings Page', () => {
    it('renders settings page title', async () => {
        renderAdminPage(<SettingsPage />, '/admin/settings')
        await waitFor(() => {
            expect(screen.getAllByText('Cài đặt').length).toBeGreaterThan(0)
        })
    })

    it('renders save button', async () => {
        renderAdminPage(<SettingsPage />, '/admin/settings')
        await waitFor(() => {
            expect(screen.getByText('Lưu thay đổi')).toBeInTheDocument()
        })
    })

    it('renders settings tabs', async () => {
        renderAdminPage(<SettingsPage />, '/admin/settings')
        await waitFor(() => {
            expect(screen.getByText('Cửa hàng')).toBeInTheDocument()
            expect(screen.getByText('Giao hàng')).toBeInTheDocument()
        })
    })
})

describe('Admin Layout', () => {
    it('renders sidebar navigation', async () => {
        renderAdminPage(<DashboardPage />)
        await waitFor(() => {
            expect(screen.getByText('Sản phẩm')).toBeInTheDocument()
        })
    })

    it('renders logo', async () => {
        renderAdminPage(<DashboardPage />)
        await waitFor(() => {
            expect(screen.getAllByText(/Flowers/i).length).toBeGreaterThan(0)
        })
    })
})
