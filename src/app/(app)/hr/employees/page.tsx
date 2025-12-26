import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { Users, Search, UserPlus, Download, Filter, ArrowUpDown, Briefcase, Clock, TrendingUp } from 'lucide-react';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HrPageHeader } from '../_components/hr-page-header';

export default async function HrEmployeesPage() {
    const headerStore = await nextHeaders();
    await getSessionContextOrRedirect({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:employees',
    });

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Employees</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <HrPageHeader
                title="Employees"
                description="Manage your organization's employee records and workforce data"
            />

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Currently employed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">Currently away</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground">New hires</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                Employee Directory
                                <Badge variant="secondary" className="font-normal">
                                    In Development
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Search and manage employee records
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm" disabled>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Employee
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search employees by name, email, or department..."
                                className="pl-9"
                                disabled
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                            </Button>
                            <Button variant="outline" size="sm" disabled>
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                Sort
                            </Button>
                        </div>
                    </div>

                    {/* Migration Notice */}
                    <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
                        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center space-y-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-7 w-7 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Migration in Progress</h3>
                                <p className="text-sm text-muted-foreground">
                                    This employee directory is being migrated from the legacy system.
                                    The following features are currently in development:
                                </p>
                            </div>
                            <div className="w-full space-y-2 text-left">
                                <div className="flex items-start gap-2 text-sm">
                                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    <span className="text-muted-foreground">Employee data loader with real-time sync</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    <span className="text-muted-foreground">Role-based access control and permissions</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    <span className="text-muted-foreground">Advanced filtering, sorting, and search</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    <span className="text-muted-foreground">Bulk operations and CSV export</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    <span className="text-muted-foreground">Employee profile pages with detailed information</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

