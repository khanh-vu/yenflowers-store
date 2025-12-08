import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

describe('Button Component', () => {
    it('renders with correct text', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('handles click events', async () => {
        const handleClick = vi.fn()
        const user = userEvent.setup()

        render(<Button onClick={handleClick}>Click me</Button>)
        await user.click(screen.getByRole('button'))

        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('can be disabled', () => {
        render(<Button disabled>Disabled</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies variant styles', () => {
        render(<Button variant="outline">Outline</Button>)
        const button = screen.getByRole('button')
        expect(button).toHaveClass('border')
    })

    it('applies size styles', () => {
        render(<Button size="lg">Large</Button>)
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
    })
})

describe('Card Component', () => {
    it('renders card with content', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Test Card</CardTitle>
                </CardHeader>
                <CardContent>Card content here</CardContent>
            </Card>
        )

        expect(screen.getByText('Test Card')).toBeInTheDocument()
        expect(screen.getByText('Card content here')).toBeInTheDocument()
    })

    it('applies custom className', () => {
        render(<Card className="custom-class" data-testid="test-card">Content</Card>)
        const card = screen.getByTestId('test-card')
        expect(card).toHaveClass('custom-class')
    })
})

describe('Badge Component', () => {
    it('renders badge text', () => {
        render(<Badge>New</Badge>)
        expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('applies variant styles', () => {
        render(<Badge variant="destructive">Error</Badge>)
        expect(screen.getByText('Error')).toBeInTheDocument()
    })
})
