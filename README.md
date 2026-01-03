# Laravel Datatable

[![Latest Version](https://img.shields.io/packagist/v/abdasis/laravel-datatable.svg)](https://packagist.org/packages/abdasis/laravel-datatable)
[![License](https://img.shields.io/packagist/l/abdasis/laravel-datatable.svg)](https://packagist.org/packages/abdasis/laravel-datatable)

A powerful Laravel + React datatable package with server-side processing, advanced filtering, sorting, and column management. Built with Laravel 12, React 19, Inertia.js, TanStack Table, and Spatie Laravel Data.

## ✨ Features

- 🚀 **Server-side Processing** - Efficient pagination, search, and filtering
- 🔍 **Global Search** - Search across multiple columns
- 🎯 **Column Filtering** - Filter per column (text, select, date, date range)
- 📊 **Multi-Column Sorting** - Sort by multiple columns with priority
- 👁️ **Column Visibility** - Show/hide columns dynamically
- 🔄 **Column Reordering** - Drag & drop to reorder columns
- 📌 **Column Pinning** - Pin columns to left or right
- 💾 **Preferences Persistence** - Auto-save to localStorage
- 📱 **Mobile Responsive** - Beautiful card view for mobile devices
- ☑️ **Row Selection** - Select multiple rows
- 🎨 **Highly Customizable** - Full control over appearance and behavior

## 📋 Requirements

- PHP >= 8.2
- Laravel >= 11.0 or 12.0
- React >= 18.0 or 19.0
- Inertia.js >= 2.0
- Spatie Laravel Data (recommended for DTOs)

## 📦 Installation

### 1. Install via Composer

```bash
composer require abdasis/laravel-datatable
```

### 2. Publish Assets

Publish the frontend components and configuration:

```bash
# Publish frontend components (React/TypeScript)
php artisan vendor:publish --tag=datatable-assets

# Publish configuration file
php artisan vendor:publish --tag=datatable-config
```

### 3. Install NPM Dependencies

```bash
npm install @tanstack/react-table sonner moment zustand react-select laravel-react-i18n @hugeicons/core-free-icons @hugeicons/react
```

### 4. Install Required Shadcn UI Components

```bash
npx shadcn@latest add context-menu popover drawer alert-dialog textarea command
```

## 🚀 Quick Start

### Backend (Laravel)

#### 1. Create a Spatie Data DTO

```php
<?php

namespace App\Data\Guides;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;

class GuideCategoryData extends Data
{
    public function __construct(
        public ?int $id,

        #[Required]
        #[Max(255)]
        public string $name,

        public ?string $slug,
        public ?string $description,
        public bool $is_active,
    ) {}
}
```

#### 2. Use DatatableService in Controller

```php
<?php

namespace App\Http\Controllers\Admin;

use Abdasis\LaravelDatatable\DatatableService;
use App\Data\Guides\GuideCategoryData;
use App\Models\GuideCategory;
use App\Repositories\Guides\GuideCategoryRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuideCategoryController extends Controller
{
    public function __construct(
        private readonly GuideCategoryRepository $repository
    ) {}

    public function index(Request $request): Response
    {
        $query = GuideCategory::query()->ordered();

        // Use DatatableService for server-side processing
        $categories = DatatableService::process(
            query: $query,
            resourceClass: GuideCategoryData::class,
            searchableColumns: ['name', 'description', 'slug'],
            perPage: 10
        );

        return Inertia::render('admin/guides/categories/index', [
            'categories' => $categories,
        ]);
    }
}
```

### Frontend (React)

#### 1. Define Columns

```tsx
// resources/js/components/admin/guides/guide-category-columns.tsx
import { GuideCategoryData } from '@/types/generated';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from '@inertiajs/react';

export const getGuideCategoryColumns = (): ColumnDef<GuideCategoryData>[] => {
    return [
        {
            header: 'Name',
            accessorKey: 'name',
            cell: ({ row }) => (
                <Link
                    href={route('admin.guides.categories.edit', row.original.id)}
                    className="font-medium text-blue-600 hover:underline"
                >
                    {row.original.name}
                </Link>
            ),
            meta: {
                filterTitle: 'Category Name',
                filterVariant: 'text',
            },
        },
        {
            header: 'Slug',
            accessorKey: 'slug',
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            cell: ({ getValue }) => (
                <span className={getValue() ? 'text-green-600' : 'text-gray-400'}>
                    {getValue() ? 'Active' : 'Inactive'}
                </span>
            ),
            meta: {
                filterVariant: 'select',
                filterOptions: [
                    { value: '1', label: 'Active' },
                    { value: '0', label: 'Inactive' },
                ],
            },
        },
    ];
};
```

#### 2. Use Datatable Component

```tsx
// resources/js/pages/admin/guides/categories/index.tsx
import Datatable from '@/components/datatable/table';
import { getGuideCategoryColumns } from '@/components/admin/guides/guide-category-columns';
import { PaginatedData } from '@/types/datatable';
import { GuideCategoryData } from '@/types/generated';
import { useMemo } from 'react';

interface Props {
    categories: PaginatedData<GuideCategoryData>;
}

export default function GuideCategoriesIndex({ categories }: Props) {
    const columns = useMemo(() => getGuideCategoryColumns(), []);

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Guide Categories</h1>

            <Datatable
                data={categories}
                columns={columns}
                tableId="guide-categories-table"
                resourceKey="categories"
            />
        </div>
    );
}
```

## 📖 Advanced Usage

### Custom Filters

```tsx
import { DatatableFilterConfig } from '@/types/datatable';

const filters: DatatableFilterConfig<GuideCategoryData>[] = [
    {
        columnId: 'created_at',
        label: 'Created Date',
        type: 'date_range',
    },
    {
        columnId: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
        ],
    },
];

<Datatable
    data={data}
    columns={columns}
    filters={filters}
/>
```

### Column Meta Options

```tsx
{
    header: 'Name',
    accessorKey: 'name',
    meta: {
        // Filter options
        filterTitle: 'Search Name',
        filterVariant: 'text', // text | select | multi_select | date | date_range | number
        filterOptions: [...], // for select/multi_select

        // Custom CSS classes
        className: 'text-right',
    },
}
```

### Table Preferences

The datatable automatically saves user preferences (column visibility, order, sorting, etc.) to localStorage when you provide a `tableId`:

```tsx
<Datatable
    data={data}
    columns={columns}
    tableId="my-unique-table-id" // Enables localStorage persistence
/>
```

## 🎨 Customization

### Backend Configuration

Edit `config/datatable.php`:

```php
return [
    'default_per_page' => 10,
    'per_page_options' => [10, 25, 50, 100],
    'max_searchable_columns' => 10,
    'cache_duration' => 60,
    'enable_query_logging' => false,
];
```

### Frontend Styling

The datatable uses Tailwind CSS and shadcn/ui components. You can customize the appearance by:

1. Modifying Tailwind classes in the components
2. Overriding shadcn/ui component styles
3. Using custom CSS classes via column `meta.className`

## 🔧 API Reference

### DatatableService

```php
DatatableService::process(
    query: Builder,           // Eloquent query builder
    resourceClass: string,    // Spatie Data class for transformation
    searchableColumns: array, // Columns to include in search
    perPage: int             // Default items per page
): array
```

### Datatable Component Props

```tsx
interface DatatableProps<TData> {
    data: PaginatedData<TData>;              // Paginated data from backend
    columns: ColumnDef<TData, any>[];        // TanStack Table column definitions
    filters?: DatatableFilterConfig<TData>[]; // Optional filter configurations
    tableId?: string;                        // Unique ID for localStorage
    resourceKey?: string;                    // Inertia partial reload key
    additionalResourceKeys?: string[];       // Additional Inertia keys
}
```

## 🐛 Troubleshooting

### TypeScript Errors

Make sure you have all peer dependencies installed:

```bash
npm install @tanstack/react-table sonner moment zustand react-select laravel-react-i18n
```

### Missing UI Components

Install required shadcn components:

```bash
npx shadcn@latest add context-menu popover drawer alert-dialog textarea command
```

### Styles Not Applying

Ensure Tailwind CSS is configured to scan the vendor directory:

```js
// tailwind.config.js
export default {
    content: [
        './resources/**/*.{js,jsx,ts,tsx}',
        './resources/js/vendor/laravel-datatable/**/*.{js,jsx,ts,tsx}', // Add this
    ],
}
```

## 📄 License

This package is open-source software licensed under the [MIT license](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👨‍💻 Author

**Abdasis**

- GitHub: [@abdasis](https://github.com/abdasis)

## 🙏 Credits

Built with these amazing technologies:

- [Laravel](https://laravel.com)
- [React](https://react.dev)
- [Inertia.js](https://inertiajs.com)
- [TanStack Table](https://tanstack.com/table)
- [Spatie Laravel Data](https://spatie.be/docs/laravel-data)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
