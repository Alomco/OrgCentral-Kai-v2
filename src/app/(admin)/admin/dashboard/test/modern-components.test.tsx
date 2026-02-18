/* @vitest-environment jsdom */
// Test file to validate the new admin dashboard components
// This file demonstrates the usage of the new components and validates their accessibility features

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModernAdminSidebar } from '@/app/(admin)/admin/_components/modern-admin-sidebar';
import { ModernAdminNavigation } from '@/app/(admin)/admin/_components/modern-admin-navigation';
import { ModernAdminDashboardHeader } from '@/app/(admin)/admin/dashboard/_components/modern-admin-dashboard-header';
import { SecurityStatusIndicator, SecureDataDisplay, ComplianceBadge } from '@/components/security/security-indicators';
import { AccessibilityStatusIndicator, AccessibilityToggle, ContrastToggle } from '@/components/accessibility/accessibility-indicators';

describe('Modern Admin Components', () => {
  describe('ModernAdminSidebar', () => {
    it('should render successfully', () => {
      const permissions = {
        organization: ['read'],
      };

      const { container } = render(
        <ModernAdminSidebar
          organizationLabel="Test Org"
          roleKey="admin"
          permissions={permissions}
        />
      );
      expect(container).toBeTruthy();
    });

    it('should toggle mobile menu correctly', async () => {
      const permissions = {
        organization: ['read'],
      };

      render(
        <ModernAdminSidebar
          organizationLabel="Test Org"
          roleKey="admin"
          permissions={permissions}
        />
      );

      // Find and click the mobile menu button
      const mobileMenuButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(mobileMenuButton);

      // Check that the sidebar is now visible
      const sidebar = await screen.findByRole(
        'navigation',
        { name: 'Admin sidebar navigation' },
        { timeout: 20000 },
      );
      expect(sidebar).not.toBeNull();
    }, 30000);
  });

  describe('ModernAdminNavigation', () => {
    it('should render successfully', () => {
      const { container } = render(
        <ModernAdminNavigation
          organizationId="test-id"
          organizationLabel="Test Org"
          roleKey="admin"
          userEmail="test@example.com"
        />
      );
      expect(container).toBeTruthy();
    });

    it('should handle search functionality', () => {
      render(
        <ModernAdminNavigation
          organizationId="test-id"
          organizationLabel="Test Org"
          roleKey="admin"
          userEmail="test@example.com"
        />
      );

      // Find the search input and simulate typing
      const searchInput = screen.getByPlaceholderText('Search admin tools...');
      fireEvent.change(searchInput, { target: { value: 'users' } });

      expect((searchInput as HTMLInputElement).value).toBe('users');
    });
  });

  describe('Security Indicators', () => {
    it('SecurityStatusIndicator should render successfully', () => {
      const { container } = render(
        <SecurityStatusIndicator status="secure" label="Secure" />
      );
      expect(container).toBeTruthy();
    });

    it('SecureDataDisplay should toggle visibility', () => {
      render(
        <SecureDataDisplay label="API Key" isSensitive={true}>
          abc123def456
        </SecureDataDisplay>
      );

      // Initially should be blurred
      const dataElement = screen.getByText('••••••••••••••••');
      expect(dataElement).not.toBeNull();

      // Click the eye button to reveal
      const eyeButton = screen.getByLabelText('Show sensitive data');
      fireEvent.click(eyeButton);

      // Should now show the actual data
      const actualData = screen.getByText('abc123def456');
      expect(actualData).not.toBeNull();
    });

    it('ComplianceBadge should render correctly', () => {
      render(
        <ComplianceBadge standard="iso27001" compliant={true} />
      );

      expect(screen.getByText('ISO 27001')).not.toBeNull();
    });
  });

  describe('Accessibility Indicators', () => {
    it('AccessibilityStatusIndicator should render successfully', () => {
      const { container } = render(
        <AccessibilityStatusIndicator status="compliant" level="aa" />
      );
      expect(container).toBeTruthy();
    });

    it('AccessibilityToggle should toggle state', () => {
      const mockToggle = vi.fn();
      const { rerender } = render(
        <AccessibilityToggle onToggle={mockToggle} isEnabled={false} />
      );

      const toggleButton = screen.getByLabelText('Enable accessibility enhancements');
      fireEvent.click(toggleButton);

      expect(mockToggle).toHaveBeenCalled();

      // Rerender with enabled state
      rerender(<AccessibilityToggle onToggle={mockToggle} isEnabled={true} />);

      expect(screen.getByLabelText('Disable accessibility enhancements')).not.toBeNull();
    });
  });
});

// Responsive design tests
describe('Responsive Design', () => {
  it('Sidebar should be collapsible on mobile', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // Mobile width
    });

    const permissions = {
      organization: ['read'],
    };

    render(
      <ModernAdminSidebar
        organizationLabel="Test Org"
        roleKey="admin"
        permissions={permissions}
      />
    );

    // On mobile, sidebar should initially be hidden
    const sidebar = screen.getByRole('navigation', { name: 'Admin sidebar navigation' });
    expect(sidebar.className).toContain('-translate-x-full');
  });

  it('Navigation should adapt to different screen sizes', () => {
    // Test desktop view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200, // Desktop width
    });

    render(
      <ModernAdminNavigation
        organizationId="test-id"
        organizationLabel="Test Org"
        roleKey="admin"
        userEmail="test@example.com"
      />
    );

    // Search bar should be visible on desktop
    expect(screen.getByPlaceholderText('Search admin tools...')).not.toBeNull();

    // Organization label should be visible on desktop
    expect(screen.getByText('Test Org')).not.toBeNull();
  });
});